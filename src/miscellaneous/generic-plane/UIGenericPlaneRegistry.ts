import type { Matrix4, Scene } from "three";
import type { UITransparencyMode } from "../UITransparencyMode";
import { UIGenericInstancedPlane } from "./UIGenericInstancedPlane";
import { UIGenericPlane } from "./UIGenericPlane";
import type { GenericPlaneData, UIPropertyType } from "./shared";

interface PlaneDescriptor {
  plane: UIGenericPlane | UIGenericInstancedPlane;
  instanceHandler?: number;
  forceSingleInstance: boolean;
}

/**
 * Manages plane lifecycle and automatic batching.
 *
 * Handles creation, updates, and destruction of planes while automatically
 * promoting compatible single planes to instanced planes and demoting
 * instanced planes back to single when only one instance remains.
 */
export class UIPlaneRegistry {
  private readonly descriptors = new Map<number, PlaneDescriptor>();
  private lastHandler = 0;

  constructor(private readonly scene: Scene) {}

  /**
   * Creates a new plane with the given configuration.
   *
   * @param source - GLSL fragment shader source (must define vec4 draw() function)
   * @param properties - Map of property names to values
   * @param transparency - Transparency rendering mode
   * @param forceSingleInstance - If true, always creates UIGenericPlane (for render targets, etc.)
   * @returns Handler for managing the plane
   */
  public create(
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
    forceSingleInstance: boolean,
  ): number {
    const handler = this.lastHandler++;

    const descriptor: PlaneDescriptor = {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      plane: undefined!,
      forceSingleInstance,
    };
    this.descriptors.set(handler, descriptor);

    this.placeInstance(descriptor, {
      source,
      properties,
      transparency,
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      transform: undefined!,
      visibility: true,
    });

    return handler;
  }

  /**
   * Destroys a plane and releases its resources.
   *
   * @param handler - Handler returned from create
   */
  public destroy(handler: number): void {
    const descriptor = this.resolveDescriptor(handler);
    this.descriptors.delete(handler);
    this.removeFromCurrentPlane(descriptor);
  }

  /**
   * Updates transform matrix for a plane.
   *
   * @param handler - Handler returned from create
   * @param transform - Matrix4 transform to apply
   */
  public setTransform(handler: number, transform: Matrix4): void {
    const descriptor = this.resolveDescriptor(handler);

    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      descriptor.plane.setTransform(descriptor.instanceHandler, transform);
    } else if (descriptor.plane instanceof UIGenericPlane) {
      descriptor.plane.setTransform(transform);
    }
  }

  /**
   * Updates properties for a plane.
   *
   * @param handler - Handler returned from create
   * @param properties - Properties to update
   */
  public setProperties(
    handler: number,
    properties: Record<string, UIPropertyType>,
  ): void {
    const descriptor = this.resolveDescriptor(handler);

    if (descriptor.forceSingleInstance) {
      (descriptor.plane as UIGenericPlane).setProperties(properties);
      return;
    }

    const currentData = this.extractInstanceData(descriptor);
    const newProperties = { ...currentData.properties, ...properties };

    const needsRelocation = this.checkNeedsRelocation(
      descriptor,
      currentData,
      newProperties,
      currentData.transparency,
    );

    if (needsRelocation) {
      this.removeFromCurrentPlane(descriptor);
      this.placeInstance(descriptor, {
        ...currentData,
        properties: newProperties,
      });
    } else {
      this.updatePropertiesInPlace(descriptor, properties);
    }
  }

  /**
   * Updates visibility for a plane.
   *
   * @param handler - Handler returned from create
   * @param visible - Whether the plane should be visible
   */
  public setVisibility(handler: number, visible: boolean): void {
    const descriptor = this.resolveDescriptor(handler);

    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      descriptor.plane.setVisibility(descriptor.instanceHandler, visible);
    } else if (descriptor.plane instanceof UIGenericPlane) {
      descriptor.plane.setVisibility(visible);
    }
  }

  /**
   * Updates transparency mode for a plane.
   *
   * @param handler - Handler returned from create
   * @param transparency - New transparency mode
   */
  public setTransparency(
    handler: number,
    transparency: UITransparencyMode,
  ): void {
    const descriptor = this.resolveDescriptor(handler);
    const currentData = this.extractInstanceData(descriptor);

    if (currentData.transparency === transparency) {
      return;
    }

    if (descriptor.forceSingleInstance) {
      (descriptor.plane as UIGenericPlane).setTransparency(transparency);
      return;
    }

    const needsRelocation = this.checkNeedsRelocation(
      descriptor,
      currentData,
      currentData.properties,
      transparency,
    );

    if (needsRelocation) {
      this.removeFromCurrentPlane(descriptor);
      this.placeInstance(descriptor, {
        ...currentData,
        transparency,
      });
    } else if (descriptor.plane instanceof UIGenericPlane) {
      descriptor.plane.setTransparency(transparency);
    }
  }

  // ============================================================
  // Core instance management
  // ============================================================

  /**
   * Places an instance into the optimal plane (existing or new).
   */
  private placeInstance(
    descriptor: PlaneDescriptor,
    data: GenericPlaneData,
  ): void {
    const { source, properties, transparency, transform, visibility } = data;

    if (!descriptor.forceSingleInstance) {
      // Try to find compatible instanced plane
      const compatibleInstanced = this.findCompatibleInstancedPlane(
        source,
        properties,
        transparency,
      );

      if (compatibleInstanced) {
        this.attachToInstancedPlane(
          descriptor,
          compatibleInstanced,
          properties,
          transform,
          visibility,
        );
        return;
      }

      // Try to find compatible single plane for promotion
      const promotable = this.findCompatibleSinglePlane(
        source,
        properties,
        transparency,
        descriptor,
      );

      if (promotable) {
        const instancedPlane = this.promoteToInstanced(promotable, properties);
        this.attachToInstancedPlane(
          descriptor,
          instancedPlane,
          properties,
          transform,
          visibility,
        );
        return;
      }
    }

    // Create new single plane
    this.createSinglePlane(
      descriptor,
      source,
      properties,
      transparency,
      transform,
      visibility,
    );
  }

  /**
   * Extracts current instance data from descriptor.
   */
  private extractInstanceData(descriptor: PlaneDescriptor): GenericPlaneData {
    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      return descriptor.plane.extractInstanceData(descriptor.instanceHandler);
    }

    return (descriptor.plane as UIGenericPlane).extractInstanceData();
  }

  /**
   * Removes instance from its current plane, handling demote/destroy as needed.
   */
  private removeFromCurrentPlane(descriptor: PlaneDescriptor): void {
    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      const instancedPlane = descriptor.plane;
      instancedPlane.destroyInstance(descriptor.instanceHandler);

      if (instancedPlane.instanceCount === 0) {
        this.scene.remove(instancedPlane);
        instancedPlane.destroy();
      } else if (instancedPlane.instanceCount === 1) {
        this.demoteToSingle(instancedPlane, descriptor);
      }
    } else if (descriptor.plane instanceof UIGenericPlane) {
      this.scene.remove(descriptor.plane);
      descriptor.plane.destroy();
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    descriptor.plane = undefined!;
    delete descriptor.instanceHandler;
  }

  /**
   * Updates properties in place without relocation.
   */
  private updatePropertiesInPlace(
    descriptor: PlaneDescriptor,
    properties: Record<string, UIPropertyType>,
  ): void {
    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      descriptor.plane.setProperties(descriptor.instanceHandler, properties);
    } else if (descriptor.plane instanceof UIGenericPlane) {
      descriptor.plane.setProperties(properties);
    }
  }

  /**
   * Checks if relocation is needed based on property/transparency changes.
   */
  private checkNeedsRelocation(
    descriptor: PlaneDescriptor,
    currentData: GenericPlaneData,
    newProperties: Record<string, UIPropertyType>,
    newTransparency: UITransparencyMode,
  ): boolean {
    const isInstanced = descriptor.plane instanceof UIGenericInstancedPlane;

    if (isInstanced) {
      // Transparency change always requires relocation for instanced
      if (currentData.transparency !== newTransparency) {
        return true;
      }

      // Check if properties are still compatible
      return !descriptor.plane.arePropertiesCompatible(newProperties);
    }

    // For single plane: check if we can now merge with something
    const compatibleInstanced = this.findCompatibleInstancedPlane(
      currentData.source,
      newProperties,
      newTransparency,
    );
    if (compatibleInstanced) {
      return true;
    }

    const promotable = this.findCompatibleSinglePlane(
      currentData.source,
      newProperties,
      newTransparency,
      descriptor,
    );
    if (promotable) {
      return true;
    }

    return false;
  }

  // ============================================================
  // Attach helpers
  // ============================================================

  /**
   * Attaches descriptor to an instanced plane.
   */
  private attachToInstancedPlane(
    descriptor: PlaneDescriptor,
    instancedPlane: UIGenericInstancedPlane,
    properties: Record<string, UIPropertyType>,
    transform: Matrix4 | null,
    visibility: boolean,
  ): void {
    const instanceHandler = instancedPlane.createInstance();
    instancedPlane.setProperties(instanceHandler, properties);
    if (transform) {
      instancedPlane.setTransform(instanceHandler, transform);
    }
    instancedPlane.setVisibility(instanceHandler, visibility);

    descriptor.plane = instancedPlane;
    descriptor.instanceHandler = instanceHandler;
  }

  /**
   * Creates a new single plane and attaches descriptor to it.
   */
  private createSinglePlane(
    descriptor: PlaneDescriptor,
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
    transform: Matrix4 | null,
    visibility: boolean,
  ): void {
    const singlePlane = new UIGenericPlane(source, properties, transparency);
    singlePlane.setProperties(properties);
    if (transform) {
      singlePlane.setTransform(transform);
    }
    singlePlane.setVisibility(visibility);
    this.scene.add(singlePlane);

    descriptor.plane = singlePlane;
    delete descriptor.instanceHandler;
  }

  // ============================================================
  // Finding compatible planes
  // ============================================================

  private findCompatibleSinglePlane(
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
    excludeDescriptor?: PlaneDescriptor,
  ): PlaneDescriptor | null {
    for (const descriptor of this.descriptors.values()) {
      if (descriptor === excludeDescriptor) {
        continue;
      }
      if (descriptor.forceSingleInstance) {
        continue;
      }

      if (
        descriptor.plane instanceof UIGenericPlane &&
        descriptor.plane.isCompatible(source, properties, transparency)
      ) {
        return descriptor;
      }
    }
    return null;
  }

  private findCompatibleInstancedPlane(
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
  ): UIGenericInstancedPlane | null {
    for (const descriptor of this.descriptors.values()) {
      if (
        descriptor.plane instanceof UIGenericInstancedPlane &&
        descriptor.plane.isCompatible(source, properties, transparency)
      ) {
        return descriptor.plane;
      }
    }
    return null;
  }

  // ============================================================
  // Promote / Demote
  // ============================================================

  /**
   * Promotes a single plane to instanced, transferring its data.
   */
  private promoteToInstanced(
    promotableDescriptor: PlaneDescriptor,
    templateProperties: Record<string, UIPropertyType>,
  ): UIGenericInstancedPlane {
    const oldPlane = promotableDescriptor.plane as UIGenericPlane;
    const oldData = oldPlane.extractInstanceData();

    const instancedPlane = new UIGenericInstancedPlane(
      oldData.source,
      templateProperties,
      oldData.transparency,
    );

    // Transfer old plane as first instance
    const oldInstanceHandler = instancedPlane.createInstance();
    instancedPlane.setProperties(oldInstanceHandler, oldData.properties);
    instancedPlane.setTransform(oldInstanceHandler, oldData.transform);
    instancedPlane.setVisibility(oldInstanceHandler, oldData.visibility);

    // Update promotable descriptor
    promotableDescriptor.plane = instancedPlane;
    promotableDescriptor.instanceHandler = oldInstanceHandler;

    // Replace in scene
    this.scene.remove(oldPlane);
    oldPlane.destroy();
    this.scene.add(instancedPlane);

    return instancedPlane;
  }

  /**
   * Demotes an instanced plane with one remaining instance back to single.
   */
  private demoteToSingle(
    instancedPlane: UIGenericInstancedPlane,
    removedDescriptor: PlaneDescriptor,
  ): void {
    // Find descriptor with remaining instance
    let remainingDescriptor: PlaneDescriptor | undefined;

    for (const descriptor of this.descriptors.values()) {
      if (
        descriptor !== removedDescriptor &&
        descriptor.plane === instancedPlane &&
        descriptor.instanceHandler !== undefined
      ) {
        remainingDescriptor = descriptor;
        break;
      }
    }

    if (!remainingDescriptor) {
      return;
    }

    // Extract data using the unified method
    const data = instancedPlane.extractInstanceData(
      remainingDescriptor.instanceHandler as number,
    );

    // Create single plane
    const singlePlane = new UIGenericPlane(
      data.source,
      data.properties,
      data.transparency,
    );
    singlePlane.setProperties(data.properties);
    singlePlane.setTransform(data.transform);
    singlePlane.setVisibility(data.visibility);

    // Replace in scene
    this.scene.remove(instancedPlane);
    instancedPlane.destroy();
    this.scene.add(singlePlane);

    // Update remaining descriptor
    remainingDescriptor.plane = singlePlane;
    delete remainingDescriptor.instanceHandler;
  }

  // ============================================================
  // Utility
  // ============================================================

  private resolveDescriptor(handler: number): PlaneDescriptor {
    const descriptor = this.descriptors.get(handler);
    if (!descriptor) {
      throw new Error(
        `UIGenericPlaneRegistry.resolveDescriptor.handler: descriptor not found`,
      );
    }
    return descriptor;
  }
}

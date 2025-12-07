import type { Matrix4, Object3D, WebGLRenderer } from "three";
import { Color, OrthographicCamera, Scene } from "three";
import {
  resolveTypeInfo,
  type UIPropertyType,
} from "../miscellaneous/generic-plane/shared";
import { UIGenericInstancedPlane } from "../miscellaneous/generic-plane/UIGenericInstancedPlane";
import { UIGenericPlane } from "../miscellaneous/generic-plane/UIGenericPlane";
import type { UITransparencyMode } from "../miscellaneous/UITransparencyMode";

let originalClearColor: Color = new Color();
let originalClearAlpha = 0;
let originalAutoClear = false;
let originalAutoClearColor = false;
let originalAutoClearDepth = false;
let originalAutoClearStencil = false;

interface PlaneDescriptor {
  plane: UIGenericPlane | UIGenericInstancedPlane;
  instanceHandler?: number;
}

export class UISceneWrapper {
  private readonly scene = new Scene();
  private readonly camera: OrthographicCamera;

  private readonly descriptors = new Map<number, PlaneDescriptor>();
  private lastHandler = 0;

  constructor(w: number, h: number) {
    this.camera = new OrthographicCamera(0, w, h, 0, -1024, 1024);
  }

  /**
   * Creates a new plane with the given shader and properties.
   *
   * @param source - GLSL fragment shader source (must define vec4 draw() function)
   * @param properties - Map of property names to values
   * @param transparency - Transparency rendering mode
   * @param forceSingleInstance - If true, always creates UIGenericPlane (for render targets, etc.)
   * @returns Handler for managing the plane
   */
  public createPlane(
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
    forceSingleInstance: boolean,
  ): number {
    const handler = this.lastHandler++;

    if (!forceSingleInstance) {
      // Try to find compatible UIGenericPlane for promotion
      const promotable = this.findCompatibleSinglePlane(
        source,
        properties,
        transparency,
      );
      if (promotable) {
        const instancedPlane = this.promoteToInstanced(promotable, properties);
        const instanceHandler = instancedPlane.createInstances(1);
        instancedPlane.setProperties(instanceHandler, 0, [properties]);

        this.descriptors.set(handler, {
          plane: instancedPlane,
          instanceHandler,
        });
        return handler;
      }

      // Try to find compatible UIGenericInstancedPlane
      const compatibleInstanced = this.findCompatibleInstancedPlane(
        source,
        properties,
        transparency,
      );
      if (compatibleInstanced) {
        const instanceHandler = compatibleInstanced.createInstances(1);
        compatibleInstanced.setProperties(instanceHandler, 0, [properties]);

        this.descriptors.set(handler, {
          plane: compatibleInstanced,
          instanceHandler,
        });
        return handler;
      }
    }

    // Create single UIGenericPlane
    const plane = new UIGenericPlane(source, properties, transparency);
    plane.setProperties(properties);
    this.scene.add(plane);
    this.descriptors.set(handler, { plane });

    return handler;
  }

  /**
   * Destroys a plane and releases its resources.
   *
   * @param handler - Handler returned from createPlane
   */
  public destroyPlane(handler: number): void {
    const descriptor = this.resolveDescriptor(handler);

    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      const instancedPlane = descriptor.plane;
      instancedPlane.destroyInstances(descriptor.instanceHandler);

      if (instancedPlane.instanceCount === 0) {
        // Empty — remove completely
        this.scene.remove(instancedPlane);
        instancedPlane.destroy();
      } else if (instancedPlane.instanceCount === 1) {
        // One instance left — demote to UIGenericPlane
        this.demoteToSingle(instancedPlane, descriptor.instanceHandler);
      }
    } else {
      this.scene.remove(descriptor.plane);
      descriptor.plane.destroy();
    }

    this.descriptors.delete(handler);
  }

  /**
   * Updates transform matrix for a plane.
   *
   * @param handler - Handler returned from createPlane
   * @param transform - Matrix4 transform to apply
   */
  public setTransform(handler: number, transform: Matrix4): void {
    const descriptor = this.resolveDescriptor(handler);

    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      descriptor.plane.setTransforms(descriptor.instanceHandler, 0, [
        transform,
      ]);
    } else if (descriptor.plane instanceof UIGenericPlane) {
      descriptor.plane.setTransform(transform);
    }
  }

  /**
   * Updates properties for a plane.
   *
   * @param handler - Handler returned from createPlane
   * @param properties - Properties to update
   */
  public setProperties(
    handler: number,
    properties: Record<string, UIPropertyType>,
  ): void {
    const descriptor = this.resolveDescriptor(handler);

    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      const currentProperties = descriptor.plane.properties;
      let compatibilityBroken = false;

      for (const [name, newValue] of Object.entries(properties)) {
        if (!(name in currentProperties)) {
          continue;
        }

        const info = resolveTypeInfo(newValue);
        if (!info.instantiable && currentProperties[name] !== newValue) {
          compatibilityBroken = true;
          break;
        }
      }

      if (compatibilityBroken) {
        this.relocateInstance(descriptor, properties);
      } else {
        descriptor.plane.setProperties(descriptor.instanceHandler, 0, [
          properties,
        ]);
      }
    } else if (descriptor.plane instanceof UIGenericPlane) {
      descriptor.plane.setProperties(properties);
    }
  }

  /**
   * Updates visibility for a plane.
   *
   * @param handler - Handler returned from createPlane
   * @param visible - Whether the plane should be visible
   */
  public setVisibility(handler: number, visible: boolean): void {
    const descriptor = this.resolveDescriptor(handler);

    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      descriptor.plane.setVisibility(descriptor.instanceHandler, 0, [visible]);
    } else if (descriptor.plane instanceof UIGenericPlane) {
      descriptor.plane.setVisibility(visible);
    }
  }

  /**
   * Updates transparency mode for a plane.
   *
   * @param handler - Handler returned from createPlane
   * @param transparency - New transparency mode
   */
  public setTransparency(
    handler: number,
    transparency: UITransparencyMode,
  ): void {
    const descriptor = this.resolveDescriptor(handler);

    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      if (descriptor.plane.transparency !== transparency) {
        this.relocateInstance(descriptor, undefined, transparency);
      }
    } else if (descriptor.plane instanceof UIGenericPlane) {
      descriptor.plane.setTransparency(transparency);
    }
  }

  /**
   * Adds a custom Three.js object to the scene.
   *
   * @param object - Object3D to add
   */
  public insertCustomObject(object: Object3D): this {
    this.scene.add(object);
    return this;
  }

  /**
   * Removes a custom Three.js object from the scene.
   *
   * @param object - Object3D to remove
   */
  public removeCustomObject(object: Object3D): this {
    this.scene.remove(object);
    return this;
  }

  /**
   * Updates camera dimensions.
   *
   * @param width - New width
   * @param height - New height
   */
  public resize(width: number, height: number): this {
    this.camera.right = width;
    this.camera.top = height;
    this.camera.updateProjectionMatrix();
    return this;
  }

  /**
   * Renders the scene.
   *
   * @param renderer - WebGLRenderer to use
   */
  public render(renderer: WebGLRenderer): this {
    originalClearColor = renderer.getClearColor(originalClearColor);
    originalClearAlpha = renderer.getClearAlpha();
    originalAutoClear = renderer.autoClear;
    originalAutoClearColor = renderer.autoClearColor;
    originalAutoClearDepth = renderer.autoClearDepth;
    originalAutoClearStencil = renderer.autoClearStencil;

    renderer.autoClear = false;
    renderer.autoClearColor = false;
    renderer.autoClearDepth = false;
    renderer.autoClearStencil = false;
    renderer.setClearColor(0x000000, 1);

    renderer.clear(false, true, true);
    renderer.render(this.scene, this.camera);

    renderer.setClearColor(originalClearColor);
    renderer.setClearAlpha(originalClearAlpha);
    renderer.autoClear = originalAutoClear;
    renderer.autoClearColor = originalAutoClearColor;
    renderer.autoClearDepth = originalAutoClearDepth;
    renderer.autoClearStencil = originalAutoClearStencil;
    return this;
  }

  private relocateInstance(
    descriptor: PlaneDescriptor,
    newProperties?: Record<string, UIPropertyType>,
    newTransparency?: UITransparencyMode,
  ): void {
    const oldInstancedPlane = descriptor.plane as UIGenericInstancedPlane;
    const oldInstanceHandler = descriptor.instanceHandler as number;

    const currentProperties =
      oldInstancedPlane.extractInstanceProperties(oldInstanceHandler);
    const transform =
      oldInstancedPlane.extractInstanceTransform(oldInstanceHandler);
    const visibility =
      oldInstancedPlane.extractInstanceVisibility(oldInstanceHandler);

    const source = oldInstancedPlane.source;
    const properties = newProperties
      ? { ...currentProperties, ...newProperties }
      : currentProperties;
    const transparency = newTransparency ?? oldInstancedPlane.transparency;

    oldInstancedPlane.destroyInstances(oldInstanceHandler);

    if (oldInstancedPlane.instanceCount === 0) {
      this.scene.remove(oldInstancedPlane);
      oldInstancedPlane.destroy();
    } else if (oldInstancedPlane.instanceCount === 1) {
      this.demoteToSingle(oldInstancedPlane, oldInstanceHandler);
    }

    const compatibleInstanced = this.findCompatibleInstancedPlane(
      source,
      properties,
      transparency,
    );

    if (compatibleInstanced) {
      const newInstanceHandler = compatibleInstanced.createInstances(1);
      compatibleInstanced.setProperties(newInstanceHandler, 0, [properties]);
      compatibleInstanced.setTransforms(newInstanceHandler, 0, [transform]);
      compatibleInstanced.setVisibility(newInstanceHandler, 0, [visibility]);

      descriptor.plane = compatibleInstanced;
      descriptor.instanceHandler = newInstanceHandler;
      return;
    }

    const promotable = this.findCompatibleSinglePlane(
      source,
      properties,
      transparency,
    );

    if (promotable) {
      const instancedPlane = this.promoteToInstanced(promotable, properties);
      const newInstanceHandler = instancedPlane.createInstances(1);
      instancedPlane.setProperties(newInstanceHandler, 0, [properties]);
      instancedPlane.setTransforms(newInstanceHandler, 0, [transform]);
      instancedPlane.setVisibility(newInstanceHandler, 0, [visibility]);

      descriptor.plane = instancedPlane;
      descriptor.instanceHandler = newInstanceHandler;
      return;
    }

    const singlePlane = new UIGenericPlane(source, properties, transparency);
    singlePlane.setProperties(properties);
    singlePlane.setTransform(transform);
    singlePlane.setVisibility(visibility);
    this.scene.add(singlePlane);

    descriptor.plane = singlePlane;
    delete descriptor.instanceHandler;
  }

  private findCompatibleSinglePlane(
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
  ): { handler: number; descriptor: PlaneDescriptor } | null {
    for (const [handler, descriptor] of this.descriptors) {
      if (
        descriptor.plane instanceof UIGenericPlane &&
        descriptor.plane.isCompatible(source, properties, transparency)
      ) {
        return { handler, descriptor };
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

  private promoteToInstanced(
    promotable: { handler: number; descriptor: PlaneDescriptor },
    newProperties: Record<string, UIPropertyType>,
  ): UIGenericInstancedPlane {
    const oldPlane = promotable.descriptor.plane as UIGenericPlane;

    const instancedPlane = new UIGenericInstancedPlane(
      oldPlane.source,
      newProperties,
      oldPlane.transparency,
    );

    // Transfer old plane as first instance
    const oldInstanceHandler = instancedPlane.createInstances(1);
    instancedPlane.setProperties(oldInstanceHandler, 0, [oldPlane.properties]);

    // Transfer transform
    instancedPlane.setTransforms(oldInstanceHandler, 0, [oldPlane.transform]);

    // Transfer visibility
    instancedPlane.setVisibility(oldInstanceHandler, 0, [oldPlane.visibility]);

    // Update descriptor for old plane
    promotable.descriptor.plane = instancedPlane;
    promotable.descriptor.instanceHandler = oldInstanceHandler;

    // Replace in scene
    this.scene.remove(oldPlane);
    oldPlane.destroy();
    this.scene.add(instancedPlane);

    return instancedPlane;
  }

  private demoteToSingle(
    instancedPlane: UIGenericInstancedPlane,
    ignoredHandler: number,
  ): void {
    // Find descriptor with remaining instance
    let remainingHandler: number | undefined;
    let remainingDescriptor: PlaneDescriptor | undefined;

    for (const [handler, descriptor] of this.descriptors) {
      if (
        descriptor.plane === instancedPlane &&
        descriptor.instanceHandler !== undefined &&
        descriptor.instanceHandler !== ignoredHandler
      ) {
        remainingHandler = handler;
        remainingDescriptor = descriptor;
        break;
      }
    }

    if (remainingHandler === undefined || remainingDescriptor === undefined) {
      return;
    }

    // Extract data from remaining instance
    const properties = instancedPlane.extractInstanceProperties(
      remainingDescriptor.instanceHandler as number,
    );
    const transform = instancedPlane.extractInstanceTransform(
      remainingDescriptor.instanceHandler as number,
    );
    const visibility = instancedPlane.extractInstanceVisibility(
      remainingDescriptor.instanceHandler as number,
    );

    // Create UIGenericPlane
    const singlePlane = new UIGenericPlane(
      instancedPlane.source,
      properties,
      instancedPlane.transparency,
    );
    singlePlane.setProperties(properties);
    singlePlane.setTransform(transform);
    singlePlane.setVisibility(visibility);

    // Replace in scene
    this.scene.remove(instancedPlane);
    instancedPlane.destroy();
    this.scene.add(singlePlane);

    // Update descriptor
    remainingDescriptor.plane = singlePlane;
    delete remainingDescriptor.instanceHandler;
  }

  private resolveDescriptor(handler: number): PlaneDescriptor {
    const descriptor = this.descriptors.get(handler);
    if (!descriptor) {
      throw new Error(`No descriptor found for handler ${handler}`);
    }
    return descriptor;
  }
}

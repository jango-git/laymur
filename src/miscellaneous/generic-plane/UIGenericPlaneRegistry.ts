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

export class UIPlaneRegistry {
  private readonly descriptors = new Map<number, PlaneDescriptor>();
  private lastHandler = 0;

  constructor(private readonly scene: Scene) {}

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

  public destroy(handler: number): void {
    const descriptor = this.resolveDescriptor(handler);
    this.descriptors.delete(handler);
    this.removeFromCurrentPlane(descriptor);
  }

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

  private placeInstance(
    descriptor: PlaneDescriptor,
    data: GenericPlaneData,
  ): void {
    const { source, properties, transparency, transform, visibility } = data;

    if (!descriptor.forceSingleInstance) {
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

    this.createSinglePlane(
      descriptor,
      source,
      properties,
      transparency,
      transform,
      visibility,
    );
  }

  private extractInstanceData(descriptor: PlaneDescriptor): GenericPlaneData {
    if (
      descriptor.plane instanceof UIGenericInstancedPlane &&
      descriptor.instanceHandler !== undefined
    ) {
      return descriptor.plane.extractInstanceData(descriptor.instanceHandler);
    }

    return (descriptor.plane as UIGenericPlane).extractInstanceData();
  }

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

  private checkNeedsRelocation(
    descriptor: PlaneDescriptor,
    currentData: GenericPlaneData,
    newProperties: Record<string, UIPropertyType>,
    newTransparency: UITransparencyMode,
  ): boolean {
    const isInstanced = descriptor.plane instanceof UIGenericInstancedPlane;

    if (isInstanced) {
      if (currentData.transparency !== newTransparency) {
        return true;
      }

      return !descriptor.plane.arePropertiesCompatible(newProperties);
    }

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

    const oldInstanceHandler = instancedPlane.createInstance();
    instancedPlane.setProperties(oldInstanceHandler, oldData.properties);
    instancedPlane.setTransform(oldInstanceHandler, oldData.transform);
    instancedPlane.setVisibility(oldInstanceHandler, oldData.visibility);

    promotableDescriptor.plane = instancedPlane;
    promotableDescriptor.instanceHandler = oldInstanceHandler;

    this.scene.remove(oldPlane);
    oldPlane.destroy();
    this.scene.add(instancedPlane);

    return instancedPlane;
  }

  private demoteToSingle(
    instancedPlane: UIGenericInstancedPlane,
    removedDescriptor: PlaneDescriptor,
  ): void {
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

    const data = instancedPlane.extractInstanceData(
      remainingDescriptor.instanceHandler as number,
    );

    const singlePlane = new UIGenericPlane(
      data.source,
      data.properties,
      data.transparency,
    );
    singlePlane.setProperties(data.properties);
    singlePlane.setTransform(data.transform);
    singlePlane.setVisibility(data.visibility);

    this.scene.remove(instancedPlane);
    instancedPlane.destroy();
    this.scene.add(singlePlane);

    remainingDescriptor.plane = singlePlane;
    delete remainingDescriptor.instanceHandler;
  }

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

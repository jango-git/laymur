import type { Matrix4, Scene } from "three";
import type { UITransparencyMode } from "../../UITransparencyMode";
import {
  convertUIPropertiesToGLProperties,
  type GLProperty,
  type PlaneData,
  type UIProperty,
} from "../shared";
import { UIGenericInstancedPlane } from "../UIGenericInstancedPlane/UIGenericInstancedPlane";
import { UIGenericPlane } from "../UIGenericPlane/UIGenericPlane";
import {
  isInstancedPlaneDescriptor,
  isSinglePlaneDescriptor,
  type InstancedPlaneDescriptor,
  type PlaneDescriptor,
  type SinglePlaneDescriptor,
} from "./UIGenericPlaneRegistry.Internal";

export class UIPlaneRegistry {
  private lastHandler = 0;
  private readonly handlerToPlaneDescriptor = new Map<
    number,
    PlaneDescriptor
  >();

  constructor(private readonly scene: Scene) {}

  public createPlane(
    source: string,
    properties: Record<string, UIProperty>,
    transform: Matrix4,
    visibility: boolean,
    transparency: UITransparencyMode,
  ): number {
    const handler = this.lastHandler++;
    this.insertPlane(handler, {
      source,
      properties: convertUIPropertiesToGLProperties(properties),
      transform,
      visibility,
      transparency,
    });
    return handler;
  }

  public destroyPlane(handler: number): void {
    const planeDescriptor = this.resolvePlaneDescriptor(handler);

    if (isSinglePlaneDescriptor(planeDescriptor)) {
      this.scene.remove(planeDescriptor.plane);
      planeDescriptor.plane.destroy();
    } else {
      const instancedPlane = planeDescriptor.plane;
      if (instancedPlane.instanceCount === 1) {
        this.scene.remove(instancedPlane);
        instancedPlane.destroy();
      } else if (instancedPlane.instanceCount === 2) {
        this.demoteInstancedPlaneToSinglePlane(instancedPlane, planeDescriptor);
      }
    }

    this.handlerToPlaneDescriptor.delete(handler);
  }

  public setProperties(
    handler: number,
    properties: Record<string, UIProperty>,
  ): void {
    const planeDescriptor = this.resolvePlaneDescriptor(handler);
    const glProperties = convertUIPropertiesToGLProperties(properties);

    if (isSinglePlaneDescriptor(planeDescriptor)) {
      planeDescriptor.plane.setProperties(glProperties);
      return;
    }

    const arePropertiesCompatible =
      planeDescriptor.plane.arePropertiesPartiallyCompatible(glProperties);

    if (arePropertiesCompatible) {
      planeDescriptor.plane.setProperties(
        planeDescriptor.instanceHandler,
        glProperties,
      );
      return;
    }

    const planeData = planeDescriptor.plane.extractInstanceData(
      planeDescriptor.instanceHandler,
    );
    planeData.properties = { ...planeData.properties, ...glProperties };
    this.destroyPlane(handler);
    this.insertPlane(handler, planeData);
  }

  public setTransform(handler: number, transform: Matrix4): void {
    const planeDescriptor = this.resolvePlaneDescriptor(handler);

    if (isSinglePlaneDescriptor(planeDescriptor)) {
      planeDescriptor.plane.setTransform(transform);
      return;
    }

    planeDescriptor.plane.setTransform(
      planeDescriptor.instanceHandler,
      transform,
    );
  }

  public setVisibility(handler: number, visibility: boolean): void {
    const planeDescriptor = this.resolvePlaneDescriptor(handler);

    if (isSinglePlaneDescriptor(planeDescriptor)) {
      planeDescriptor.plane.setVisibility(visibility);
      return;
    }

    planeDescriptor.plane.setVisibility(
      planeDescriptor.instanceHandler,
      visibility,
    );
  }

  public setTransparency(
    handler: number,
    transparency: UITransparencyMode,
  ): void {
    const planeDescriptor = this.resolvePlaneDescriptor(handler);

    if (planeDescriptor.plane.transparency === transparency) {
      return;
    }

    if (isSinglePlaneDescriptor(planeDescriptor)) {
      planeDescriptor.plane.setTransparency(transparency);
      return;
    }

    const planeData = planeDescriptor.plane.extractInstanceData(
      planeDescriptor.instanceHandler,
    );
    this.destroyPlane(handler);
    this.insertPlane(handler, {
      ...planeData,
      transparency,
    });
  }

  private promoteSinglePlaneToInstancedPlane(
    handler: number,
    planeDescriptor: SinglePlaneDescriptor,
  ): UIGenericInstancedPlane {
    this.destroyPlane(handler);
    const { source, properties, transform, visibility, transparency } =
      planeDescriptor.plane.extractPlaneData();
    const plane = new UIGenericInstancedPlane(source, properties, transparency);

    const instanceHandler = plane.createInstance();
    plane.setProperties(instanceHandler, properties);
    plane.setTransform(instanceHandler, transform);
    plane.setVisibility(instanceHandler, visibility);

    this.handlerToPlaneDescriptor.set(handler, { plane, instanceHandler });
    return plane;
  }

  private demoteInstancedPlaneToSinglePlane(
    instancedPlane: UIGenericInstancedPlane,
    removedDescriptor: InstancedPlaneDescriptor,
  ): void {
    let remainingPair: [number, InstancedPlaneDescriptor] | undefined;

    for (const [handler, planeDescriptor] of this.handlerToPlaneDescriptor) {
      if (
        isInstancedPlaneDescriptor(planeDescriptor) &&
        planeDescriptor !== removedDescriptor &&
        planeDescriptor.plane === instancedPlane
      ) {
        remainingPair = [handler, planeDescriptor];
        break;
      }
    }

    if (!remainingPair) {
      throw new Error(
        "UIGenericPlaneRegistry.demoteInstancedPlaneToSinglePlane: remaining pair not found",
      );
    }

    const { source, properties, transform, visibility, transparency } =
      instancedPlane.extractInstanceData(remainingPair[1].instanceHandler);

    this.scene.remove(instancedPlane);
    instancedPlane.destroy();

    const plane = new UIGenericPlane(
      source,
      properties,
      transform,
      visibility,
      transparency,
    );

    this.scene.add(plane);
    this.handlerToPlaneDescriptor.set(remainingPair[0], { plane });
  }

  private attachToInstancedPlane(
    handler: number,
    instancedPlane: UIGenericInstancedPlane,
    properties: Record<string, GLProperty>,
    transform: Matrix4,
    visibility: boolean,
  ): void {
    const instanceHandler = instancedPlane.createInstance();
    instancedPlane.setProperties(instanceHandler, properties);
    instancedPlane.setTransform(instanceHandler, transform);
    instancedPlane.setVisibility(instanceHandler, visibility);
    this.handlerToPlaneDescriptor.set(handler, {
      plane: instancedPlane,
      instanceHandler,
    });
  }

  private insertPlane(handler: number, planeData: PlaneData): void {
    const { source, properties, transparency, transform, visibility } =
      planeData;

    const compatibleInstancedPlane = this.findCompatibleInstancedPlane(
      source,
      properties,
      transparency,
    );

    if (compatibleInstancedPlane) {
      this.attachToInstancedPlane(
        handler,
        compatibleInstancedPlane,
        properties,
        transform,
        visibility,
      );
      return;
    }

    const compatibleSinglePlanePair = this.findCompatibleSinglePlane(
      source,
      properties,
      transparency,
    );

    if (compatibleSinglePlanePair) {
      const instancedPlane = this.promoteSinglePlaneToInstancedPlane(
        compatibleSinglePlanePair[0],
        compatibleSinglePlanePair[1],
      );
      this.attachToInstancedPlane(
        handler,
        instancedPlane,
        properties,
        transform,
        visibility,
      );
      return;
    }

    const plane = new UIGenericPlane(
      source,
      properties,
      transform,
      visibility,
      transparency,
    );
    this.scene.add(plane);
    this.handlerToPlaneDescriptor.set(handler, { plane });
  }

  private findCompatibleSinglePlane(
    source: string,
    properties: Record<string, GLProperty>,
    transparency: UITransparencyMode,
  ): [number, SinglePlaneDescriptor] | undefined {
    for (const handlerPlaneDescriptorPair of this.handlerToPlaneDescriptor) {
      const planeDescriptor = handlerPlaneDescriptorPair[1];
      if (
        isSinglePlaneDescriptor(planeDescriptor) &&
        planeDescriptor.plane.isPartiallyCompatible(
          source,
          properties,
          transparency,
        )
      ) {
        return [handlerPlaneDescriptorPair[0], planeDescriptor];
      }
    }
    return undefined;
  }

  private findCompatibleInstancedPlane(
    source: string,
    properties: Record<string, GLProperty>,
    transparency: UITransparencyMode,
  ): UIGenericInstancedPlane | undefined {
    for (const handlerPlaneDescriptorPair of this.handlerToPlaneDescriptor) {
      const planeDescriptor = handlerPlaneDescriptorPair[1];
      if (
        isInstancedPlaneDescriptor(planeDescriptor) &&
        planeDescriptor.plane.isPartiallyCompatible(
          source,
          properties,
          transparency,
        )
      ) {
        return planeDescriptor.plane;
      }
    }
    return undefined;
  }

  private resolvePlaneDescriptor(handler: number): PlaneDescriptor {
    const descriptor = this.handlerToPlaneDescriptor.get(handler);
    if (!descriptor) {
      throw new Error(
        `UIGenericPlaneRegistry.resolvePlaneDescriptor.handler: descriptor not found`,
      );
    }
    return descriptor;
  }
}

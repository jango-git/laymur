import type { Matrix4, Object3D } from "three";
import type { UITransparencyMode } from "../../miscellaneous/UITransparencyMode.js";
import type { HSLAdjustment, UIProperty } from "../../miscellaneous/generic-plane/shared.js";

export interface UISceneWrapperView {
  createPlane(
    source: string,
    properties: Record<string, UIProperty>,
    transform: Matrix4,
    visibility: boolean,
    transparency: UITransparencyMode,
    blend: number,
    hsl: HSLAdjustment,
  ): number;
  destroyPlane(handler: number): void;

  setTransform(handler: number, transform: Matrix4): void;
  setProperties(handler: number, properties: Record<string, UIProperty>): void;
  setVisibility(handler: number, visible: boolean): void;
  setTransparency(handler: number, transparency: UITransparencyMode): void;
  setBlend(handler: number, blend: number): void;
  setHSL(handler: number, hsl: HSLAdjustment): void;

  insertOrderedObject(object: Object3D, depth: number): void;
  setOrderedObjectDepth(object: Object3D, depth: number): void;
  removeOrderedObject(object: Object3D): void;

  insertCustomObject(object: Object3D): void;
  removeCustomObject(object: Object3D): void;
}

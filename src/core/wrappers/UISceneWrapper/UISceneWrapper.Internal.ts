import type { Matrix4, Object3D } from "three";
import type { UITransparencyMode } from "../../miscellaneous/UITransparencyMode";
import type { UIProperty } from "../../miscellaneous/generic-plane/shared";

export interface UISceneWrapperView {
  createPlane(
    source: string,
    properties: Record<string, UIProperty>,
    transform: Matrix4,
    visibility: boolean,
    transparency: UITransparencyMode,
  ): number;
  destroyPlane(handler: number): void;

  setTransform(handler: number, transform: Matrix4): void;
  setProperties(handler: number, properties: Record<string, UIProperty>): void;
  setVisibility(handler: number, visible: boolean): void;
  setTransparency(handler: number, transparency: UITransparencyMode): void;

  insertCustomObject(object: Object3D): void;
  removeCustomObject(object: Object3D): void;
}

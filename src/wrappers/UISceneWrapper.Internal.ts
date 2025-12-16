import type { Matrix4, Object3D } from "three";
import type { UITransparencyMode } from "../miscellaneous/UITransparencyMode";
import type { UIPropertyType } from "../miscellaneous/generic-plane/shared";

export interface UISceneWrapperInterface {
  createPlane(
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
    forceSingleInstance: boolean,
  ): number;
  destroyPlane(handler: number): void;

  setTransform(handler: number, transform: Matrix4): void;
  setProperties(
    handler: number,
    properties: Record<string, UIPropertyType>,
  ): void;
  setVisibility(handler: number, visible: boolean): void;
  setTransparency(handler: number, transparency: UITransparencyMode): void;

  insertCustomObject(object: Object3D): void;
  removeCustomObject(object: Object3D): void;
}

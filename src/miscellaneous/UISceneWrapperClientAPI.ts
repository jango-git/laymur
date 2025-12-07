import type { Matrix4, Object3D } from "three";
import type { UIPropertyType } from "./UIGenericInstancedPlane";
import type { UITransparencyMode } from "./UITransparencyMode";

export interface UISceneWrapperClientAPI {
  createPlane(source: string, uniforms: Record<string, UIPropertyType>): number;
  destroyPlane(handler: number): this;

  setTransform(handler: number, value: Matrix4): this;
  setUniform(
    handler: number,
    uniform: string,
    value: UIPropertyType | undefined,
  ): this;
  setTransparency(handler: number, mode: UITransparencyMode): this;
  setVisibility(handler: number, visible: boolean): this;

  insertCustomObject(object: Object3D): this;
  removeCustomObject(object: Object3D): this;
}

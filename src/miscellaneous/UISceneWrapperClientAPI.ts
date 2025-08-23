import type { Matrix4, Object3D } from "three";
import type { UITransparencyMode } from "./UITransparencyMode";

export interface UISceneWrapperClientAPI {
  createPlane(source: string, uniforms: Record<string, unknown>): number;
  destroyPlane(handler: number): this;
  setTransform(handler: number, value: Matrix4): this;
  setUniform(handler: number, uniform: string, value: unknown): this;
  setTransparency(handler: number, mode: UITransparencyMode): this;
  setVisibility(handler: number, visible: boolean): this;

  // A temporary solution needed to make the particle system work.
  // Presumably it will be removed later, once scenewrapper can render instances.
  insertCustomObject(object: Object3D): this;
  removeCustomObject(object: Object3D): this;
}

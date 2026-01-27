import type { Matrix4 } from "three";
import type { UITransparencyMode } from "../../UITransparencyMode";
import type { GLProperty } from "../shared";
import type { UIGenericInstancedPlane } from "../UIGenericInstancedPlane/UIGenericInstancedPlane";

export interface PlaneDescriptor {
  mesh: UIGenericInstancedPlane;
  instanceIndex: number;
}

export interface PlaneState {
  source: string;
  properties: Record<string, GLProperty>;
  transform: Matrix4;
  visibility: boolean;
  transparency: UITransparencyMode;
  zIndex: number;
}

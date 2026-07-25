import type { Matrix4 } from "three";
import type { UITransparencyMode } from "../../UITransparencyMode.js";
import type { GLProperty, HSLAdjustment } from "../shared.js";
import type { UIGenericInstancedPlane } from "../UIGenericInstancedPlane/UIGenericInstancedPlane.js";

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
  blend: number;
  hsl: HSLAdjustment;
  zIndex: number;
}

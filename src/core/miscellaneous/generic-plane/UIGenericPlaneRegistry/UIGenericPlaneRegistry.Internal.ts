import type { Matrix4 } from "three";

import type { UITransparencyMode } from "../../UITransparencyMode.js";
import type { GLProperty, HSLAdjustment, PlaneMask } from "../shared.js";
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
  /** Mask with its own copy of the data, null for an unmasked plane */
  mask: (PlaneMask & { data: Float32Array }) | null;
  zIndex: number;
}

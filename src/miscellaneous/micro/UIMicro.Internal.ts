/** Anchor mode for UIMicro transformations. */
export enum UIMicroAnchorMode {
  /** Rotation and scale around anchor. */
  ROTATION_SCALE = 0,
  /** Position, rotation, and scale around anchor. */
  POSITION_ROTATION_SCALE = 1,
}

export interface UIMicroConfig {
  x: number;
  y: number;
  anchorX: number;
  anchorY: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
  anchorMode: UIMicroAnchorMode;
}

export const MICRO_DEFAULT_POSITION = 0;
export const MICRO_DEFAULT_ANCHOR = 0.5;
export const MICRO_DEFAULT_SCALE = 1;
export const MICRO_DEFAULT_ROTATION = 0;
export const MICRO_DEFAULT_ANCHOR_MODE = UIMicroAnchorMode.ROTATION_SCALE;

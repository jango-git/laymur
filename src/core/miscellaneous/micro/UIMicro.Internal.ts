/** Controls which transforms apply relative to anchor */
export enum UIMicroAnchorMode {
  /** Apply rotation and scale around anchor point */
  ROTATION_SCALE = 0,
  /** Apply position, rotation, and scale around anchor point */
  POSITION_ROTATION_SCALE = 1,
}

/** Configuration options for UIMicro */
export interface UIMicroConfig {
  /** X offset in world units */
  x: number;
  /** Y offset in world units */
  y: number;
  /** X anchor in normalized coordinates (0 to 1) */
  anchorX: number;
  /** Y anchor in normalized coordinates (0 to 1) */
  anchorY: number;
  /** X scale multiplier */
  scaleX: number;
  /** Y scale multiplier */
  scaleY: number;
  /** Rotation in radians */
  rotation: number;
  /** Which transforms apply relative to anchor */
  anchorMode: UIMicroAnchorMode;
}

export const MICRO_DEFAULT_POSITION = 0;
export const MICRO_DEFAULT_ANCHOR = 0.5;
export const MICRO_DEFAULT_SCALE = 1;
export const MICRO_DEFAULT_ROTATION = 0;
export const MICRO_DEFAULT_ANCHOR_MODE = UIMicroAnchorMode.ROTATION_SCALE;

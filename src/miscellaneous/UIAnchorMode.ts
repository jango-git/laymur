/**
 * Defines the anchor mode for UIMicro, determining which transformations are applied around the anchor point.
 */
export enum UIAnchorMode {
  /** Rotation and scaling are applied around the anchor point */
  ROTATION_SCALE = 0,
  /** Position, rotation, and scaling transformations are all applied around the anchor point */
  POSITION_ROTATION_SCALE = 1,
}

import type { UIInsetsConfig } from "../insets/UIInsets.Internal.js";

/** Shape a mask cuts out of the rectangle of its source */
export enum UIMaskShape {
  /** Rectangle, optionally with rounded corners (see `radius`) */
  RECTANGLE = 0,
  /** Ellipse inscribed into the rectangle; a circle when the rectangle is a square */
  ELLIPSE = 1,
}

/** Configuration options for UIMask */
export interface UIMaskOptions {
  /** Shape cut out of the source rectangle */
  shape: UIMaskShape;
  /** Corner radius of RECTANGLE in world units, clamped to half of the smaller side */
  radius: number;
  /**
   * Width of the soft edge in world units, laid inside the shape so nothing leaks out of it.
   * 0 keeps a hard edge, still antialiased over about a pixel.
   */
  softness: number;
  /** Insets shrinking the source rectangle, in world units */
  padding: UIInsetsConfig;
  /** Whether the mask keeps the outside of the shape instead of the inside */
  inverted: boolean;
  /** Whether the micro transform of the source moves the mask, when the source has one */
  useMicro: boolean;
  /** Whether masked elements also stop catching input outside the visible part */
  clipInput: boolean;
}

export const MASK_DEFAULT_SHAPE = UIMaskShape.RECTANGLE;
export const MASK_DEFAULT_RADIUS = 0;
export const MASK_DEFAULT_SOFTNESS = 0;
export const MASK_DEFAULT_INVERTED = false;
export const MASK_DEFAULT_USE_MICRO = true;
export const MASK_DEFAULT_CLIP_INPUT = true;

/**
 * Number of floats in the packed mask data:
 * - [0..2] first row of the layer -> mask-local affine map
 * - [3..5] second row of that map
 * - [6..9] half width, half height, corner radius, softness (world units)
 * - [10] mode: shape + 2 when inverted
 *
 * Mask-local space is centered on the mask, its axes follow the source rotation and its units
 * are world units, so distances and softness stay isotropic.
 */
export const MASK_DATA_SIZE = 11;

export const MASK_DATA_ROW0_OFFSET = 0;
export const MASK_DATA_ROW1_OFFSET = 3;
export const MASK_DATA_SHAPE_OFFSET = 6;
export const MASK_DATA_MODE_OFFSET = 10;

/**
 * Translation that puts every point of an empty mask (a source collapsed to no area) far
 * outside its zero-sized shape, in world units
 */
export const MASK_EMPTY_OFFSET = 1e6;

/** Mode value of an external material patch with no mask applied */
export const MASK_MODE_DISABLED = -1;

/**
 * Signed distance from a mask-local point to the shape boundary, negative inside. Matches the
 * GLSL laymurMaskDistance in sign; for the ellipse neither is the exact distance.
 */
export function computeMaskDistance(
  localX: number,
  localY: number,
  halfWidth: number,
  halfHeight: number,
  radius: number,
  shape: UIMaskShape,
): number {
  if (shape === UIMaskShape.ELLIPSE) {
    if (halfWidth <= 0 || halfHeight <= 0) {
      return Infinity;
    }
    const nx = localX / halfWidth;
    const ny = localY / halfHeight;
    // The input test only needs the sign; the smaller axis keeps the units sensible
    return (Math.sqrt(nx * nx + ny * ny) - 1) * Math.min(halfWidth, halfHeight);
  }

  const qx = Math.abs(localX) - halfWidth + radius;
  const qy = Math.abs(localY) - halfHeight + radius;
  const outsideX = Math.max(qx, 0);
  const outsideY = Math.max(qy, 0);
  return (
    Math.sqrt(outsideX * outsideX + outsideY * outsideY) + Math.min(Math.max(qx, qy), 0) - radius
  );
}

import shapeMaskSource from "../../shaders/UIShapeMask.js";
import type { UIInsetsConfig } from "../insets/UIInsets.Internal.js";
import type { UIMaskOptions, UIMaskProgram } from "./UIMask.Internal.js";

/** Shape a shape mask cuts out of the rectangle of its source */
export enum UIMaskShape {
  /** Rectangle, optionally with rounded corners (see `radius`) */
  RECTANGLE = 0,
  /** Ellipse inscribed into the rectangle; a circle when the rectangle is a square */
  ELLIPSE = 1,
}

/** Configuration options for UIShapeMask */
export interface UIShapeMaskOptions extends UIMaskOptions {
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
  /** Whether masked elements also stop catching input outside the visible part */
  clipInput: boolean;
}

export const SHAPE_MASK_DEFAULT_SHAPE = UIMaskShape.RECTANGLE;
export const SHAPE_MASK_DEFAULT_RADIUS = 0;
export const SHAPE_MASK_DEFAULT_SOFTNESS = 0;
export const SHAPE_MASK_DEFAULT_CLIP_INPUT = true;

/**
 * Number of floats in the packed shape mask data:
 * - [0..2] first row of the layer -> mask-local affine map
 * - [3..5] second row of that map
 * - [6..9] half width, half height, corner radius, softness (world units)
 * - [10] mode: shape + 2 when inverted
 *
 * Mask-local space is centered on the mask, its axes follow the source rotation and its units
 * are world units, so distances and softness stay isotropic.
 */
export const SHAPE_MASK_DATA_SIZE = 11;

export const SHAPE_MASK_DATA_ROW0_OFFSET = 0;
export const SHAPE_MASK_DATA_ROW1_OFFSET = 3;
export const SHAPE_MASK_DATA_SHAPE_OFFSET = 6;
export const SHAPE_MASK_DATA_MODE_OFFSET = 10;

/** Mode value of an external material patch with no mask applied */
export const SHAPE_MASK_MODE_DISABLED = -1;

export const SHAPE_MASK_PROGRAM: UIMaskProgram = {
  name: "laymur-shape-mask",
  fields: [
    { name: "instanceMaskRow0", type: "Vector3", vertexOnly: true },
    { name: "instanceMaskRow1", type: "Vector3", vertexOnly: true },
    { name: "instanceMaskShape", type: "Vector4", vertexOnly: false },
    { name: "instanceMaskMode", type: "number", vertexOnly: false },
  ],
  dataSize: SHAPE_MASK_DATA_SIZE,
  buildVertex: (read) => /* glsl */ `
    vec2 maskLocal = vec2(
      dot(${read("instanceMaskRow0")}, maskPoint),
      dot(${read("instanceMaskRow1")}, maskPoint)
    );
  `,
  varyings: [
    {
      name: "p_instanceMaskLocal",
      glslTypeName: "vec2",
      components: ["maskLocal.x", "maskLocal.y"],
    },
  ],
  fragmentSource: shapeMaskSource,
  coverage: "laymurMaskCoverage(p_instanceMaskLocal, p_instanceMaskShape, p_instanceMaskMode)",
  textured: false,
};

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

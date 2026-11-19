import type { UIColorConfig } from "../color/UIColor.Internal.js";

/** Color stop of a gradient */
export interface UIGradientStop {
  /** Position along the gradient, from 0 to 1 */
  offset: number;
  /** Color at the position. A string is a `UIColor` name or a CSS color. */
  color: UIColorConfig;
}

/** Geometry of a linear gradient, in fractions of the filled box from its top left corner */
export interface UILinearGradientOptions {
  /** Horizontal position of the start */
  startX: number;
  /** Vertical position of the start */
  startY: number;
  /** Horizontal position of the end */
  endX: number;
  /** Vertical position of the end */
  endY: number;
}

/**
 * Geometry of a radial gradient. The center is in fractions of the filled box from its top left
 * corner, the radii in fractions of its longer side.
 */
export interface UIRadialGradientOptions {
  /** Horizontal position of the center */
  centerX: number;
  /** Vertical position of the center */
  centerY: number;
  /** Radius where offset 0 is */
  innerRadius: number;
  /** Radius where offset 1 is */
  outerRadius: number;
}

/** From the top edge to the bottom one */
export const LINEAR_GRADIENT_DEFAULT_OPTIONS: UILinearGradientOptions = {
  startX: 0.5,
  startY: 0,
  endX: 0.5,
  endY: 1,
};

/** From the center to the ends of the longer axis, the middles of the shorter sides */
export const RADIAL_GRADIENT_DEFAULT_OPTIONS: UIRadialGradientOptions = {
  centerX: 0.5,
  centerY: 0.5,
  innerRadius: 0,
  outerRadius: 0.5,
};

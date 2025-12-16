import type { UIOrientation } from "../../miscellaneous/UIOrientation";
import type { UIPriority } from "../../miscellaneous/UIPriority";
import type { UIRelation } from "../../miscellaneous/UIRelation";

/**
 * Generic 2D type for specifying horizontal and vertical values.
 *
 * This interface allows configuration of properties that can have
 * different values for horizontal and vertical directions.
 *
 * @template T - The type of values for horizontal and vertical properties
 */
export interface UIType2D<T> {
  /** Horizontal (x-axis) value. */
  h?: T;
  /** Vertical (y-axis) value. */
  v?: T;
}

/**
 * Base options for 2D constraint configuration.
 */
export interface UIConstraint2DOptions {
  /** Priority levels for horizontal and vertical constraints. */
  priority: UIType2D<UIPriority>;
  /** Mathematical relations for horizontal and vertical constraints. */
  relation: UIType2D<UIRelation>;
  /** Orientation settings for horizontal and vertical constraints. */
  orientation: UIType2D<UIOrientation>;
}

/**
 * Configuration options for 2D size constraints.
 */
export interface UIConstraintSize2DOptions extends UIConstraint2DOptions {
  /** Size values for horizontal (width) and vertical (height) dimensions. */
  size: UIType2D<number>;
}

/**
 * Configuration options for 2D distance constraints.
 */
export interface UIConstraintDistance2DOptions extends UIConstraint2DOptions {
  /** Anchor points for element A in horizontal and vertical directions. */
  anchorA: UIType2D<number>;
  /** Anchor points for element B in horizontal and vertical directions. */
  anchorB: UIType2D<number>;
  /** Distance values for horizontal and vertical spacing. */
  distance: UIType2D<number>;
}

/**
 * Configuration options for 2D proportion constraints.
 */
export interface UIConstraintProportion2DOptions extends UIConstraint2DOptions {
  /** Proportion ratios for horizontal and vertical relationships. */
  proportion: UIType2D<number>;
}

/**
 * Result object containing horizontal and vertical constraint instances.
 *
 * @template TH - The type of the horizontal constraint
 * @template TV - The type of the vertical constraint
 */
export interface UIConstraint2DResult<TH, TV> {
  /** The horizontal constraint instance. */
  h: TH;
  /** The vertical constraint instance. */
  v: TV;
}

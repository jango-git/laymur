import { UIHeightConstraint } from "../constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "../constraints/UIWidthConstraint";
import type { UIElement } from "../elements/UIElement";
import type { UIPlaneElement, UIPointElement } from "../miscellaneous/asserts";
import type { UIOrientation } from "../miscellaneous/UIOrientation";
import type { UIPriority } from "../miscellaneous/UIPriority";
import type { UIRelation } from "../miscellaneous/UIRelation";

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
interface UIConstraint2DOptions {
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

/**
 * Builder utility for creating paired horizontal and vertical constraints.
 *
 * UIConstraint2DBuilder simplifies the creation of constraint pairs that work
 * together to define 2D relationships between UI elements. Instead of manually
 * creating separate horizontal and vertical constraints, this builder allows
 * you to specify both dimensions at once with a unified interface.
 *
 * This is particularly useful for creating consistent spacing, sizing, and
 * proportional relationships across both axes simultaneously.
 *
 * @see {@link UIWidthConstraint} - Horizontal size constraints
 * @see {@link UIHeightConstraint} - Vertical size constraints
 * @see {@link UIHorizontalDistanceConstraint} - Horizontal spacing constraints
 * @see {@link UIVerticalDistanceConstraint} - Vertical spacing constraints
 */
export class UIConstraint2DBuilder {
  /**
   * Creates paired width and height constraints for an element.
   *
   * This method generates both horizontal (width) and vertical (height)
   * size constraints simultaneously, allowing you to set fixed dimensions
   * for both axes with a single call.
   *
   * @param element - The UI element to apply size constraints to
   * @param options - Configuration options for both width and height constraints
   * @returns Object containing the created width and height constraint instances
   */
  public static size(
    element: UIElement,
    options: Partial<UIConstraintSize2DOptions> = {},
  ): UIConstraint2DResult<UIWidthConstraint, UIHeightConstraint> {
    return {
      h: new UIWidthConstraint(element, {
        width: options.size?.h,
        priority: options.priority?.h,
        relation: options.relation?.h,
        orientation: options.orientation?.h,
      }),
      v: new UIHeightConstraint(element, {
        height: options.size?.v,
        priority: options.priority?.v,
        relation: options.relation?.v,
        orientation: options.orientation?.v,
      }),
    };
  }

  /**
   * Creates paired horizontal and vertical distance constraints between two elements.
   *
   * This method generates both horizontal and vertical spacing constraints
   * simultaneously, allowing you to define 2D spacing relationships with
   * configurable anchor points for both axes.
   *
   * @param a - The first UI element (point or plane element)
   * @param b - The second UI element (point or plane element)
   * @param options - Configuration options for both horizontal and vertical distance constraints
   * @returns Object containing the created horizontal and vertical distance constraint instances
   */
  public static distance(
    a: UIPointElement | UIPlaneElement,
    b: UIPointElement | UIPlaneElement,
    options: Partial<UIConstraintDistance2DOptions> = {},
  ): UIConstraint2DResult<
    UIHorizontalDistanceConstraint,
    UIVerticalDistanceConstraint
  > {
    return {
      h: new UIHorizontalDistanceConstraint(a, b, {
        anchorA: options.anchorA?.h,
        anchorB: options.anchorB?.h,
        distance: options.distance?.h,
        priority: options.priority?.h,
        relation: options.relation?.h,
        orientation: options.orientation?.h,
      }),
      v: new UIVerticalDistanceConstraint(a, b, {
        anchorA: options.anchorA?.v,
        anchorB: options.anchorB?.v,
        distance: options.distance?.v,
        priority: options.priority?.v,
        relation: options.relation?.v,
        orientation: options.orientation?.v,
      }),
    };
  }

  /**
   * Creates paired horizontal and vertical proportion constraints between two elements.
   *
   * This method generates both horizontal (width) and vertical (height)
   * proportion constraints simultaneously, allowing you to define proportional
   * relationships for both dimensions with a single call.
   *
   * @param a - The first UI plane element (whose dimensions will be multiplied by proportion)
   * @param b - The second UI plane element (target dimensions for the proportion)
   * @param options - Configuration options for both horizontal and vertical proportion constraints
   * @returns Object containing the created horizontal and vertical proportion constraint instances
   */
  public static proportion(
    a: UIPlaneElement,
    b: UIPlaneElement,
    options: Partial<UIConstraintProportion2DOptions> = {},
  ): UIConstraint2DResult<
    UIHorizontalProportionConstraint,
    UIVerticalProportionConstraint
  > {
    return {
      h: new UIHorizontalProportionConstraint(a, b, {
        proportion: options.proportion?.h,
        priority: options.priority?.h,
        relation: options.relation?.h,
        orientation: options.orientation?.h,
      }),
      v: new UIVerticalProportionConstraint(a, b, {
        proportion: options.proportion?.v,
        priority: options.priority?.v,
        relation: options.relation?.v,
        orientation: options.orientation?.v,
      }),
    };
  }
}

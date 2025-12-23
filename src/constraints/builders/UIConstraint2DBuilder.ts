import { UIHeightConstraint } from "../../constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../../constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalInterpolationConstraint } from "../../constraints/UIHorizontalInterpolationConstraint";
import { UIHorizontalProportionConstraint } from "../../constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../../constraints/UIVerticalDistanceConstraint";
import { UIVerticalInterpolationConstraint } from "../../constraints/UIVerticalInterpolationConstraint";
import { UIVerticalProportionConstraint } from "../../constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "../../constraints/UIWidthConstraint";
import type { UIElement } from "../../elements/UIElement/UIElement";
import type {
  UIPlaneElement,
  UIPointElement,
} from "../../miscellaneous/shared";
import type {
  UIConstraint2DResult,
  UIConstraintDistance2DOptions,
  UIConstraintInterpolation2DOptions,
  UIConstraintProportion2DOptions,
  UIConstraintSize2DOptions,
} from "./UIConstraint2DBuilder.Internal";
import { normalizeUIType2D } from "./UIConstraint2DBuilder.Internal";

/** Builder for paired horizontal and vertical constraints */
export class UIConstraint2DBuilder {
  /**
   * Creates width and height constraints.
   * @param element Element to constrain
   * @param options Size configuration for both axes
   * @returns Width and height constraints
   */
  public static size(
    element: UIElement,
    options: Partial<UIConstraintSize2DOptions> = {},
  ): UIConstraint2DResult<UIWidthConstraint, UIHeightConstraint> {
    const size = normalizeUIType2D(options.size);
    const priority = normalizeUIType2D(options.priority);
    const relation = normalizeUIType2D(options.relation);
    const orientation = normalizeUIType2D(options.orientation);

    return {
      h: new UIWidthConstraint(element, {
        width: size.h,
        priority: priority.h,
        relation: relation.h,
        orientation: orientation.h,
      }),
      v: new UIHeightConstraint(element, {
        height: size.v,
        priority: priority.v,
        relation: relation.v,
        orientation: orientation.v,
      }),
    };
  }

  /**
   * Creates horizontal and vertical distance constraints.
   * @param a First element
   * @param b Second element
   * @param options Distance configuration for both axes
   * @returns Horizontal and vertical distance constraints
   */
  public static distance(
    a: UIPointElement | UIPlaneElement,
    b: UIPointElement | UIPlaneElement,
    options: Partial<UIConstraintDistance2DOptions> = {},
  ): UIConstraint2DResult<
    UIHorizontalDistanceConstraint,
    UIVerticalDistanceConstraint
  > {
    const anchorA = normalizeUIType2D(options.anchorA);
    const anchorB = normalizeUIType2D(options.anchorB);
    const distance = normalizeUIType2D(options.distance);
    const priority = normalizeUIType2D(options.priority);
    const relation = normalizeUIType2D(options.relation);
    const orientation = normalizeUIType2D(options.orientation);

    return {
      h: new UIHorizontalDistanceConstraint(a, b, {
        anchorA: anchorA.h,
        anchorB: anchorB.h,
        distance: distance.h,
        priority: priority.h,
        relation: relation.h,
        orientation: orientation.h,
      }),
      v: new UIVerticalDistanceConstraint(a, b, {
        anchorA: anchorA.v,
        anchorB: anchorB.v,
        distance: distance.v,
        priority: priority.v,
        relation: relation.v,
        orientation: orientation.v,
      }),
    };
  }

  /**
   * Creates horizontal and vertical proportion constraints.
   * @param a Element with proportional dimensions
   * @param b Target element
   * @param options Proportion configuration for both axes
   * @returns Horizontal and vertical proportion constraints
   */
  public static proportion(
    a: UIPlaneElement,
    b: UIPlaneElement,
    options: Partial<UIConstraintProportion2DOptions> = {},
  ): UIConstraint2DResult<
    UIHorizontalProportionConstraint,
    UIVerticalProportionConstraint
  > {
    const proportion = normalizeUIType2D(options.proportion);
    const priority = normalizeUIType2D(options.priority);
    const relation = normalizeUIType2D(options.relation);
    const orientation = normalizeUIType2D(options.orientation);

    return {
      h: new UIHorizontalProportionConstraint(a, b, {
        proportion: proportion.h,
        priority: priority.h,
        relation: relation.h,
        orientation: orientation.h,
      }),
      v: new UIVerticalProportionConstraint(a, b, {
        proportion: proportion.v,
        priority: priority.v,
        relation: relation.v,
        orientation: orientation.v,
      }),
    };
  }

  /**
   * Creates horizontal and vertical interpolation constraints.
   * @param a First element
   * @param b Second element
   * @param c Element to position between A and B
   * @param options Interpolation configuration for both axes
   * @returns Horizontal and vertical interpolation constraints
   */
  public static interpolation(
    a: UIPointElement | UIPlaneElement,
    b: UIPointElement | UIPlaneElement,
    c: UIPointElement | UIPlaneElement,
    options: Partial<UIConstraintInterpolation2DOptions> = {},
  ): UIConstraint2DResult<
    UIHorizontalInterpolationConstraint,
    UIVerticalInterpolationConstraint
  > {
    const anchorA = normalizeUIType2D(options.anchorA);
    const anchorB = normalizeUIType2D(options.anchorB);
    const anchorC = normalizeUIType2D(options.anchorC);
    const t = normalizeUIType2D(options.t);
    const priority = normalizeUIType2D(options.priority);
    const relation = normalizeUIType2D(options.relation);
    const orientation = normalizeUIType2D(options.orientation);

    return {
      h: new UIHorizontalInterpolationConstraint(a, b, c, {
        anchorA: anchorA.h,
        anchorB: anchorB.h,
        anchorC: anchorC.h,
        t: t.h,
        priority: priority.h,
        relation: relation.h,
        orientation: orientation.h,
      }),
      v: new UIVerticalInterpolationConstraint(a, b, c, {
        anchorA: anchorA.v,
        anchorB: anchorB.v,
        anchorC: anchorC.v,
        t: t.v,
        priority: priority.v,
        relation: relation.v,
        orientation: orientation.v,
      }),
    };
  }
}

import { UIHeightConstraint } from "../../constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../../constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../../constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../../constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../../constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "../../constraints/UIWidthConstraint";
import type { UIElement } from "../../elements/UIElement/UIElement";
import type {
  UIPlaneElement,
  UIPointElement,
} from "../../miscellaneous/asserts";
import type {
  UIConstraint2DResult,
  UIConstraintDistance2DOptions,
  UIConstraintProportion2DOptions,
  UIConstraintSize2DOptions,
} from "./UIConstraint2DBuilder.Internal";

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

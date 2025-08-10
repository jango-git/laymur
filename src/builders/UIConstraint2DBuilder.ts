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

export interface UIType2D<T> {
  h?: T;
  v?: T;
}

interface UIConstraint2DOptions {
  priority: UIType2D<UIPriority>;
  relation: UIType2D<UIRelation>;
  orientation: UIType2D<UIOrientation>;
}

export interface UIConstraintSize2DOptions extends UIConstraint2DOptions {
  size: UIType2D<number>;
}

export interface UIConstraintDistance2DOptions extends UIConstraint2DOptions {
  anchorA: UIType2D<number>;
  anchorB: UIType2D<number>;
  distance: UIType2D<number>;
}

export interface UIConstraintProportion2DOptions extends UIConstraint2DOptions {
  proportion: UIType2D<number>;
}

export interface UIConstraint2DResult<TH, TV> {
  h: TH;
  v: TV;
}

export class UIConstraint2DBuilder {
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

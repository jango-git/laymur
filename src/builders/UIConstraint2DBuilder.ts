import type { UIConstraintPower } from "../constraints/UIConstraintPower";
import type { UIConstraintRule } from "../constraints/UIConstraintRule";
import { UIHeightConstraint } from "../constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "../constraints/UIWidthConstraint";
import type { UIAnchor } from "../elements/UIAnchor";
import type { UIElement } from "../elements/UIElement";
import type { UILayer } from "../layers/UILayer";
import type { UIOrientation } from "../miscellaneous/UIOrientation";

export interface UIType2D<T> {
  h?: T;
  v?: T;
}

interface UIConstraint2DOptions {
  power: UIType2D<UIConstraintPower>;
  rule: UIType2D<UIConstraintRule>;
  orientation: UIType2D<UIOrientation>;
}

export interface UIConstraintSize2DOptions extends UIConstraint2DOptions {
  size: UIType2D<number>;
}

export interface UIConstraintSize2DOptions extends UIConstraint2DOptions {
  anchorOne: UIType2D<number>;
  anchorTwo: UIType2D<number>;
  distance: UIType2D<number>;
}

export interface UIConstraintProportion2DOptions extends UIConstraint2DOptions {
  proportion: UIType2D<number>;
}

export interface UIConstraint2DResult<TX, TY> {
  x: TX;
  y: TY;
}

export class UIConstraint2DBuilder {
  public static size(
    element: UIElement,
    options: Partial<UIConstraintSize2DOptions> = {},
  ): UIConstraint2DResult<UIWidthConstraint, UIHeightConstraint> {
    return {
      x: new UIWidthConstraint(element, {
        width: options.size?.h,
        power: options.power?.h,
        rule: options.rule?.h,
        orientation: options.orientation?.h,
      }),
      y: new UIHeightConstraint(element, {
        height: options.size?.v,
        power: options.power?.v,
        rule: options.rule?.v,
        orientation: options.orientation?.v,
      }),
    };
  }

  public static distance(
    elementOne: UIElement | UIAnchor | UILayer,
    elementTwo: UIElement | UIAnchor,
    options: Partial<UIConstraintSize2DOptions> = {},
  ): UIConstraint2DResult<
    UIHorizontalDistanceConstraint,
    UIVerticalDistanceConstraint
  > {
    return {
      x: new UIHorizontalDistanceConstraint(elementOne, elementTwo, {
        anchorOne: options.anchorOne?.h,
        anchorTwo: options.anchorTwo?.h,
        distance: options.distance?.h,
        power: options.power?.h,
        rule: options.rule?.h,
        orientation: options.orientation?.h,
      }),
      y: new UIVerticalDistanceConstraint(elementOne, elementTwo, {
        anchorOne: options.anchorOne?.v,
        anchorTwo: options.anchorTwo?.v,
        distance: options.distance?.v,
        power: options.power?.v,
        rule: options.rule?.v,
        orientation: options.orientation?.v,
      }),
    };
  }

  public static proportion(
    elementOne: UIElement | UILayer,
    elementTwo: UIElement,
    options: Partial<UIConstraintProportion2DOptions> = {},
  ): UIConstraint2DResult<
    UIHorizontalProportionConstraint,
    UIVerticalProportionConstraint
  > {
    return {
      x: new UIHorizontalProportionConstraint(elementOne, elementTwo, {
        proportion: options.proportion?.h,
        power: options.power?.h,
        rule: options.rule?.h,
        orientation: options.orientation?.h,
      }),
      y: new UIVerticalProportionConstraint(elementOne, elementTwo, {
        proportion: options.proportion?.v,
        power: options.power?.v,
        rule: options.rule?.v,
        orientation: options.orientation?.v,
      }),
    };
  }
}

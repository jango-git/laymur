import type { UIConstraintPower } from "../Constraints/UIConstraintPower";
import type { UIConstraintRule } from "../Constraints/UIConstraintRule";
import { UIHeightConstraint } from "../Constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../Constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../Constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../Constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../Constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "../Constraints/UIWidthConstraint";
import type { UIAnchor } from "../Elements/UIAnchor";
import type { UIElement } from "../Elements/UIElement";
import type { UILayer } from "../Layers/UILayer";
import type { UIOrientation } from "../Miscellaneous/UIOrientation";

export interface UIType2D<T> {
  x?: T;
  y?: T;
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
        width: options.size?.x,
        power: options.power?.x,
        rule: options.rule?.x,
        orientation: options.orientation?.x,
      }),
      y: new UIHeightConstraint(element, {
        height: options.size?.y,
        power: options.power?.y,
        rule: options.rule?.y,
        orientation: options.orientation?.y,
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
        anchorOne: options.anchorOne?.x,
        anchorTwo: options.anchorTwo?.x,
        distance: options.distance?.x,
        power: options.power?.x,
        rule: options.rule?.x,
        orientation: options.orientation?.x,
      }),
      y: new UIVerticalDistanceConstraint(elementOne, elementTwo, {
        anchorOne: options.anchorOne?.y,
        anchorTwo: options.anchorTwo?.y,
        distance: options.distance?.y,
        power: options.power?.y,
        rule: options.rule?.y,
        orientation: options.orientation?.y,
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
        proportion: options.proportion?.x,
        power: options.power?.x,
        rule: options.rule?.x,
        orientation: options.orientation?.x,
      }),
      y: new UIVerticalProportionConstraint(elementOne, elementTwo, {
        proportion: options.proportion?.y,
        power: options.power?.y,
        rule: options.rule?.y,
        orientation: options.orientation?.y,
      }),
    };
  }
}

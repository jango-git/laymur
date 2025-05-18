import { UIHeightConstraint } from "../Constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../Constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../Constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../Constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../Constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "../Constraints/UIWidthConstraint";
import {
  UIDistance2DConstraint,
  UIDistance2DConstraintParameters,
  UIProportion2DConstraintParameters,
  UIProprtion2DConstraint,
  UISize2DConstraint,
  UISize2DConstraintParameters,
} from "./UIConstraint2DBuilderInterfaces";

export class UIConstraintBuilder2D {
  public static size2D(
    parameters: UISize2DConstraintParameters,
  ): UISize2DConstraint {
    return {
      width: new UIWidthConstraint(parameters.element, {
        width: parameters.width,
        power: parameters.powerHorizontal,
        rule: parameters.ruleHorizontal,
      }),
      height: new UIHeightConstraint(parameters.element, {
        height: parameters.height,
        power: parameters.powerVertical,
        rule: parameters.ruleVertical,
      }),
    };
  }

  public static distance2D(
    parameters: UIDistance2DConstraintParameters,
  ): UIDistance2DConstraint {
    return {
      horizontal: new UIHorizontalDistanceConstraint(
        parameters.elementOne,
        parameters.elementTwo,
        {
          anchorOne: parameters.anchorHorizontalOne,
          anchorTwo: parameters.anchorHorizontalTwo,
          distance: parameters.distanceHorizontal,
          power: parameters.powerHorizontal,
          rule: parameters.ruleHorizontal,
        },
      ),
      vertical: new UIVerticalDistanceConstraint(
        parameters.elementOne,
        parameters.elementTwo,
        {
          anchorOne: parameters.anchorVerticalOne,
          anchorTwo: parameters.anchorVerticalTwo,
          distance: parameters.distanceVertical,
          power: parameters.powerVertical,
          rule: parameters.ruleVertical,
        },
      ),
    };
  }

  public static proportional2D(
    parameters: UIProportion2DConstraintParameters,
  ): UIProprtion2DConstraint {
    return {
      horizontal: new UIHorizontalProportionConstraint(
        parameters.elementOne,
        parameters.elementTwo,
        {
          proportion: parameters.proportionHorizontal,
          power: parameters.powerHorizontal,
          rule: parameters.ruleHorizontal,
        },
      ),
      vertical: new UIVerticalProportionConstraint(
        parameters.elementOne,
        parameters.elementTwo,
        {
          proportion: parameters.proportionVertical,
          power: parameters.powerVertical,
          rule: parameters.ruleVertical,
        },
      ),
    };
  }
}

import { UIAspectConstraint } from "../Constraints/UIAspectConstraint";
import { UIConstraint } from "../Constraints/UIConstraint";
import { UIHeightConstraint } from "../Constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../Constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../Constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../Constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../Constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "../Constraints/UIWidthConstraint";
import {
  isUICommonDoubleElementConstraintDescription,
  isUIKeepAspectConstraintDescription,
  isUIKeepSizeConstraintDescription,
  UIAnyCommonConstraintDescription,
  UIDistance2DParameters,
  UIDistance2DResult,
  UIProportional2DParameters,
  UIProportional2DResult,
  UISize2DParameters,
  UISize2DResult,
} from "./UIConstraintBuilderInterfaces";

export class UIConstraintBuilder {
  public static size2D(parameters: UISize2DParameters): UISize2DResult {
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
    parameters: UIDistance2DParameters,
  ): UIDistance2DResult {
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
    parameters: UIProportional2DParameters,
  ): UIProportional2DResult {
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

  public static fromDescription(
    description:
      | Map<string, UIAnyCommonConstraintDescription>
      | Record<string, UIAnyCommonConstraintDescription>,
  ): Map<string, UIConstraint> {
    const entries =
      description instanceof Map
        ? description.entries()
        : Object.entries(description);
    const constraints = new Map<string, UIConstraint>();

    for (const [key, value] of entries) {
      if (constraints.has(key)) throw new Error("Constraint already exists");

      if (isUIKeepAspectConstraintDescription(value)) {
        constraints.set(
          key,
          new UIAspectConstraint(value.element, {
            power: value.power,
            rule: value.rule,
          }),
        );

        if (value.keepWidth) {
          constraints.set(
            `${key}KeepWidth`,
            new UIWidthConstraint(value.element, {
              power: value.power,
              rule: value.rule,
            }),
          );
        }
      } else if (isUIKeepSizeConstraintDescription(value)) {
        constraints.set(
          `${key}KeepWidth`,
          new UIWidthConstraint(value.element, {
            power: value.power,
            rule: value.rule,
          }),
        );
        constraints.set(
          `${key}KeepHeight`,
          new UIHeightConstraint(value.element, {
            power: value.power,
            rule: value.rule,
          }),
        );
      } else if (isUICommonDoubleElementConstraintDescription(value)) {
        if (value.distance) {
          if (value.distance.x) {
            constraints.set(
              `${key}HorizontalDistance`,
              new UIHorizontalDistanceConstraint(
                value.elementOne,
                value.elementTwo,
                {
                  distance: value.distance.x,
                  power: value.power?.x,
                  rule: value.rule?.x,
                },
              ),
            );
          }

          if (value.distance.y) {
            constraints.set(
              `${key}VerticalDistance`,
              new UIVerticalDistanceConstraint(
                value.elementOne,
                value.elementTwo,
                {
                  distance: value.distance.y,
                  power: value.power?.y,
                  rule: value.rule?.y,
                },
              ),
            );
          }
        }

        if (value.proportion) {
          if (value.proportion.x) {
            constraints.set(
              `${key}HorizontalProportional`,
              new UIHorizontalProportionConstraint(
                value.elementOne,
                value.elementTwo,
                {
                  proportion: value.proportion.x,
                  power: value.power?.x,
                  rule: value.rule?.x,
                },
              ),
            );
          }

          if (value.proportion.y) {
            constraints.set(
              `${key}VerticalProportional`,
              new UIVerticalProportionConstraint(
                value.elementOne,
                value.elementTwo,
                {
                  proportion: value.proportion.x,
                  power: value.power?.x,
                  rule: value.rule?.x,
                },
              ),
            );
          }
        }
      } else {
        throw new Error("Unknown ui constraint type");
      }
    }

    return constraints;
  }
}

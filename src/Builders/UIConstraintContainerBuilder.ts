import { UIConstraintPower } from "../Constraints/UIConstraintPower";
import { UIConstraintRule } from "../Constraints/UIConstraintRule";
import { UIHeightConstraint } from "../Constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../Constraints/UIHorizontalDistanceConstraint";
import { UIVerticalDistanceConstraint } from "../Constraints/UIVerticalDistanceConstraint";
import { UIWidthConstraint } from "../Constraints/UIWidthConstraint";
import type { UIElement } from "../Elements/UIElement";

export class UIConstraintContainerBuilder {
  public static build(
    container: UIElement,
    children: UIElement[],
  ): {
    horizontalDistances: UIHorizontalDistanceConstraint[];
    verticalDistances: UIVerticalDistanceConstraint[];
    widthConstraint: UIWidthConstraint;
    heightConstraint: UIHeightConstraint;
  } {
    const horizontalDistances: UIHorizontalDistanceConstraint[] = [];
    const verticalDistances: UIVerticalDistanceConstraint[] = [];

    for (const element of children) {
      horizontalDistances.push(
        new UIHorizontalDistanceConstraint(container, element, {
          anchorOne: 0,
          anchorTwo: 0,
          distance: 0,
          rule: UIConstraintRule.LESS,
        }),
        new UIHorizontalDistanceConstraint(container, element, {
          anchorOne: 1,
          anchorTwo: 1,
          distance: 0,
          rule: UIConstraintRule.GREATER,
        }),
      );

      verticalDistances.push(
        new UIVerticalDistanceConstraint(container, element, {
          anchorOne: 0,
          anchorTwo: 0,
          distance: 0,
          rule: UIConstraintRule.LESS,
        }),
        new UIVerticalDistanceConstraint(container, element, {
          anchorOne: 1,
          anchorTwo: 1,
          distance: 0,
          rule: UIConstraintRule.GREATER,
        }),
      );
    }

    const widthConstraint = new UIWidthConstraint(container, {
      width: 0,
      power: UIConstraintPower.P4,
    });

    const heightConstraint = new UIHeightConstraint(container, {
      height: 0,
      power: UIConstraintPower.P4,
    });

    return {
      horizontalDistances,
      verticalDistances,
      widthConstraint,
      heightConstraint,
    };
  }
}

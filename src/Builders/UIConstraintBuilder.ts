import { UIAspectConstraint } from "../Constraints/UIAspectConstraint";
import { UIConstraint } from "../Constraints/UIConstraint";
import { UIHeightConstraint } from "../Constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../Constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../Constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../Constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../Constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "../Constraints/UIWidthConstraint";
import {
  isUICommonDistanceConstraintDescription,
  isUICommonProportionalConstraintDescription,
  UIAnyCommonDoubleElementConstraintDescription,
  UICommonDistanceConstraintDescription,
  UICommonProportionalConstraintDescription,
} from "./UICommonDoubleElementConstraintDescriptionInterfaces";
import {
  isUIKeepAspectConstraintDescription,
  isUIKeepSizeConstraintDescription,
  UIAnyCommonSingleElementConstraintDescription,
  UIKeepAspectConstraintDescription,
  UIKeepSizeConstraintDescription,
} from "./UICommonSingleElementConstraintDescriptionInterfaces";

export type UIAnyCommonConstraintDescription =
  | UIAnyCommonSingleElementConstraintDescription
  | UIAnyCommonDoubleElementConstraintDescription;

export class UIConstraintBuilder {
  public static fromDescription(
    description:
      | Map<string, UIAnyCommonConstraintDescription>
      | Record<string, UIAnyCommonConstraintDescription>,
  ): Record<string, UIConstraint> {
    const entries =
      description instanceof Map
        ? description.entries()
        : Object.entries(description);
    const constraints = new Map<string, UIConstraint>();

    for (const [key, value] of entries) {
      if (constraints.has(key)) throw new Error("Constraint already exists");

      if (isUIKeepAspectConstraintDescription(value)) {
        UIConstraintBuilder.buildKeepAspectConstraint(key, value, constraints);
      } else if (isUIKeepSizeConstraintDescription(value)) {
        UIConstraintBuilder.buildKeepSizeConstraint(key, value, constraints);
      } else if (isUICommonDistanceConstraintDescription(value)) {
        UIConstraintBuilder.buildDistanceConstraint(key, value, constraints);
      } else if (isUICommonProportionalConstraintDescription(value)) {
        UIConstraintBuilder.buildProportionalConstraint(
          key,
          value,
          constraints,
        );
      } else {
        throw new Error("Unknown ui constraint type");
      }
    }

    return Object.fromEntries(constraints);
  }

  private static buildKeepAspectConstraint(
    key: string,
    value: UIKeepAspectConstraintDescription,
    constraints: Map<string, UIConstraint>,
  ): void {
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
  }

  private static buildKeepSizeConstraint(
    key: string,
    value: UIKeepSizeConstraintDescription,
    constraints: Map<string, UIConstraint>,
  ): void {
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
  }

  private static buildDistanceConstraint(
    key: string,
    value: UICommonDistanceConstraintDescription,
    constraints: Map<string, UIConstraint>,
  ): void {
    if (value.distance.x !== null) {
      constraints.set(
        `${key}HorizontalDistance`,
        new UIHorizontalDistanceConstraint(value.elementOne, value.elementTwo, {
          distance: value.distance.x,
          power: value.power?.x,
          rule: value.rule?.x,
        }),
      );
    }

    if (value.distance.y !== null) {
      constraints.set(
        `${key}VerticalDistance`,
        new UIVerticalDistanceConstraint(value.elementOne, value.elementTwo, {
          distance: value.distance.y,
          power: value.power?.y,
          rule: value.rule?.y,
        }),
      );
    }
  }

  private static buildProportionalConstraint(
    key: string,
    value: UICommonProportionalConstraintDescription,
    constraints: Map<string, UIConstraint>,
  ): void {
    if (value.proportion.x !== null) {
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

    if (value.proportion.y !== null) {
      constraints.set(
        `${key}VerticalProportional`,
        new UIVerticalProportionConstraint(value.elementOne, value.elementTwo, {
          proportion: value.proportion.x,
          power: value.power?.x,
          rule: value.rule?.x,
        }),
      );
    }
  }
}

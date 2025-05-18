import { UIAspectConstraint } from "../Constraints/UIAspectConstraint";
import { UIConstraint } from "../Constraints/UIConstraint";
import { UICoverConstraint } from "../Constraints/UICoverConstraint";
import { UIHeightConstraint } from "../Constraints/UIHeightConstraint";
import { UIHorizontalDistanceConstraint } from "../Constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../Constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../Constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../Constraints/UIVerticalProportionConstraint";
import { UIWidthConstraint } from "../Constraints/UIWidthConstraint";
import {
  isUICommonCoverConstraintDescription,
  isUICommonDistanceConstraintDescription,
  isUICommonProportionalConstraintDescription,
  UIAnyCommonDoubleElementConstraintDescription,
  UICommonCoverConstraintDescription,
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
      } else if (isUICommonCoverConstraintDescription(value)) {
        UIConstraintBuilder.buildCoverConstraint(key, value, constraints);
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
      const newKey = key.replace(/(KeepAspect|Keep)$/, "") + "KeepWidth";
      constraints.set(
        newKey,
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
    const newKeyWidth = key.replace(/(KeepSize|Keep)$/, "") + "KeepWidth";
    const newKeyHeight = key.replace(/(KeepSize|Keep)$/, "") + "KeepHeight";
    constraints.set(
      newKeyWidth,
      new UIWidthConstraint(value.element, {
        power: value.power,
        rule: value.rule,
      }),
    );
    constraints.set(
      newKeyHeight,
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
    if (typeof value.distance.x === "number") {
      const newKey =
        key.replace(/(HorizontalDistance|Distance)$/, "") +
        "HorizontalDistance";
      constraints.set(
        newKey,
        new UIHorizontalDistanceConstraint(value.elementOne, value.elementTwo, {
          distance: value.distance.x,
          anchorOne: value.anchorOne?.x,
          anchorTwo: value.anchorTwo?.x,
          power: value.power?.x,
          rule: value.rule?.x,
        }),
      );
    }

    if (typeof value.distance.y === "number") {
      const newKey =
        key.replace(/(VerticalDistance|Distance)$/, "") + "VerticalDistance";
      constraints.set(
        newKey,
        new UIVerticalDistanceConstraint(value.elementOne, value.elementTwo, {
          distance: value.distance.y,
          anchorOne: value.anchorOne?.y,
          anchorTwo: value.anchorTwo?.y,
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
    if (typeof value.proportion.x === "number") {
      const newKey =
        key.replace(
          /(HorizontalProportional|HorizontalProportion|Proportional|Proportion)$/,
          "",
        ) + "HorizontalProportion";

      constraints.set(
        newKey,
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

    if (typeof value.proportion.y === "number") {
      const newKey =
        key.replace(
          /(VerticalProportional|VerticalProportion|Proportional|Proportion)$/,
          "",
        ) + "VerticalProportion";
      constraints.set(
        newKey,
        new UIVerticalProportionConstraint(value.elementOne, value.elementTwo, {
          proportion: value.proportion.y,
          power: value.power?.y,
          rule: value.rule?.y,
        }),
      );
    }
  }

  private static buildCoverConstraint(
    key: string,
    value: UICommonCoverConstraintDescription,
    constraints: Map<string, UIConstraint>,
  ): void {
    constraints.set(
      key,
      new UICoverConstraint(value.elementOne, value.elementTwo, {
        isStrict: value.isStrict,
        horizontalAnchor: value.anchor?.x,
        verticalAnchor: value.anchor?.y,
      }),
    );
  }
}

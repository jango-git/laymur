import type { UIConstraintPower } from "../Constraints/UIConstraintPower";
import { UIHorizontalDistanceConstraint } from "../Constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../Constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../Constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../Constraints/UIVerticalProportionConstraint";
import { UIDummy } from "../Elements/UIDummy";
import type { UIElement } from "../Elements/UIElement";

export interface UIStackConstraintBuilderOptions {
  offset: number;
  elements: UIElement[];
  power?: UIConstraintPower;
  createDummy?: boolean;
  keepAlignment?: boolean;
}

export interface UIStackConstraintBuilderHorizontalResult {
  dummy?: UIDummy;
  distanceConstraints: UIHorizontalDistanceConstraint[];
  proportionConstraints: UIHorizontalProportionConstraint[];
  centerConstraints: UIVerticalDistanceConstraint[];
}

export interface UIStackConstraintBuilderVerticalResult {
  dummy?: UIDummy;
  distanceConstraints: UIVerticalDistanceConstraint[];
  proportionConstraints: UIVerticalProportionConstraint[];
  centerConstraints: UIHorizontalDistanceConstraint[];
}

export class UIStackConstraintBuilder {
  public static buildHorizontal(
    options: UIStackConstraintBuilderOptions,
  ): UIStackConstraintBuilderHorizontalResult {
    const distanceConstraints = [];
    const proportionConstraints = [];
    const centerConstraints = [];

    for (let i = 0; i < options.elements.length - 1; i++) {
      const element = options.elements[i];
      const nextElement = options.elements[i + 1];

      distanceConstraints.push(
        new UIHorizontalDistanceConstraint(element, nextElement, {
          anchorOne: 1,
          anchorTwo: 0,
          distance: options.offset,
          power: options.power,
        }),
      );

      proportionConstraints.push(
        new UIHorizontalProportionConstraint(element, nextElement, {
          power: options.power,
        }),
      );

      if (options.keepAlignment !== false) {
        centerConstraints.push(
          new UIVerticalDistanceConstraint(element, nextElement, {
            power: options.power,
            anchorOne: 0,
            anchorTwo: 0,
          }),
        );
      }
    }

    return {
      dummy:
        options.createDummy !== false
          ? UIStackConstraintBuilder.createDummy(
              options.elements[0],
              options.elements[options.elements.length - 1],
            )
          : undefined,
      distanceConstraints,
      proportionConstraints,
      centerConstraints,
    };
  }

  public static buildVertical(
    options: UIStackConstraintBuilderOptions,
  ): UIStackConstraintBuilderVerticalResult {
    const distanceConstraints = [];
    const proportionConstraints = [];
    const centerConstraints = [];

    for (let i = 0; i < options.elements.length - 1; i++) {
      const element = options.elements[i];
      const nextElement = options.elements[i + 1];

      distanceConstraints.push(
        new UIVerticalDistanceConstraint(element, nextElement, {
          anchorOne: 1,
          anchorTwo: 0,
          distance: options.offset,
          power: options.power,
        }),
      );

      proportionConstraints.push(
        new UIVerticalProportionConstraint(element, nextElement, {
          power: options.power,
        }),
      );

      if (options.keepAlignment !== false) {
        centerConstraints.push(
          new UIHorizontalDistanceConstraint(element, nextElement, {
            power: options.power,
          }),
        );
      }
    }

    return {
      dummy:
        options.createDummy !== false
          ? UIStackConstraintBuilder.createDummy(
              options.elements[0],
              options.elements[options.elements.length - 1],
            )
          : undefined,
      distanceConstraints,
      proportionConstraints,
      centerConstraints,
    };
  }

  private static createDummy(
    firstElement: UIElement,
    lastElement: UIElement,
  ): UIDummy {
    const dummy = new UIDummy(lastElement.layer);

    new UIHorizontalDistanceConstraint(dummy, firstElement, {
      distance: 0,
      anchorOne: 0,
      anchorTwo: 0,
    });

    new UIVerticalDistanceConstraint(dummy, firstElement, {
      distance: 0,
      anchorOne: 0,
      anchorTwo: 0,
    });

    new UIHorizontalDistanceConstraint(dummy, lastElement, {
      distance: 0,
      anchorOne: 1,
      anchorTwo: 1,
    });

    new UIVerticalDistanceConstraint(dummy, lastElement, {
      distance: 0,
      anchorOne: 1,
      anchorTwo: 1,
    });

    return dummy;
  }
}

import type { UIConstraintPower } from "../Constraints/UIConstraintPower";
import type { UIHorizontalDistanceOptions } from "../Constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalDistanceConstraint } from "../Constraints/UIHorizontalDistanceConstraint";
import type { UIHorizontalProportionOptions } from "../Constraints/UIHorizontalProportionConstraint";
import { UIHorizontalProportionConstraint } from "../Constraints/UIHorizontalProportionConstraint";
import type { UIVerticalDistanceOptions } from "../Constraints/UIVerticalDistanceConstraint";
import { UIVerticalDistanceConstraint } from "../Constraints/UIVerticalDistanceConstraint";
import type { UIVerticalProportionOptions } from "../Constraints/UIVerticalProportionConstraint";
import { UIVerticalProportionConstraint } from "../Constraints/UIVerticalProportionConstraint";
import { UIDummy } from "../Elements/UIDummy";
import type { UIElement } from "../Elements/UIElement";
import type { UILayer } from "../Layers/UILayer";
import type { UIOrientation } from "../Miscellaneous/UIOrientation";

export interface UIConstraintStackBuilderOptions {
  distance: number;
  keepProportions: boolean;
  keepAlignment: boolean;
  power: UIConstraintPower;
  orientation: UIOrientation;
}

export interface UIConstraintStackBuilderResult<
  TDistance,
  TProportion,
  TCenter,
> {
  dummy: UIDummy;
  dummyHorizontalConstraints: UIHorizontalDistanceConstraint[];
  dummyVerticalConstraints: UIVerticalDistanceConstraint[];
  distanceConstraints: TDistance[];
  proportionConstraints: TProportion[];
  alignmentConstraints: TCenter[];
}

interface ConstraintConstructors<TDistance, TProportion, TCenter> {
  distanceConstraint: new (
    elementOne: UIElement | UILayer,
    elementTwo: UIElement,
    options:
      | Partial<UIHorizontalDistanceOptions | UIVerticalDistanceOptions>
      | undefined,
  ) => TDistance;
  proportionConstraint: new (
    elementOne: UIElement | UILayer,
    elementTwo: UIElement,
    options:
      | Partial<UIHorizontalProportionOptions | UIVerticalProportionOptions>
      | undefined,
  ) => TProportion;
  centerDistanceConstraint: new (
    elementOne: UIElement | UILayer,
    elementTwo: UIElement,
    options:
      | Partial<UIHorizontalDistanceOptions | UIVerticalDistanceOptions>
      | undefined,
  ) => TCenter;
}

export class UIConstraintStackBuilder {
  public static buildHorizontal(
    elements: UIElement[],
    options: Partial<UIConstraintStackBuilderOptions>,
  ): UIConstraintStackBuilderResult<
    UIHorizontalDistanceConstraint,
    UIHorizontalProportionConstraint,
    UIVerticalDistanceConstraint
  > {
    return this.buildStack(elements, options, {
      distanceConstraint: UIHorizontalDistanceConstraint,
      proportionConstraint: UIHorizontalProportionConstraint,
      centerDistanceConstraint: UIVerticalDistanceConstraint,
    });
  }

  public static buildVertical(
    elements: UIElement[],
    options: Partial<UIConstraintStackBuilderOptions>,
  ): UIConstraintStackBuilderResult<
    UIVerticalDistanceConstraint,
    UIVerticalProportionConstraint,
    UIHorizontalDistanceConstraint
  > {
    return this.buildStack(elements, options, {
      distanceConstraint: UIVerticalDistanceConstraint,
      proportionConstraint: UIVerticalProportionConstraint,
      centerDistanceConstraint: UIHorizontalDistanceConstraint,
    });
  }

  private static buildStack<TDistance, TProportion, TCenter>(
    elements: UIElement[],
    options: Partial<UIConstraintStackBuilderOptions>,
    constructors: ConstraintConstructors<TDistance, TProportion, TCenter>,
  ): UIConstraintStackBuilderResult<TDistance, TProportion, TCenter> {
    const distances: TDistance[] = [];
    const proportions: TProportion[] = [];
    const centers: TCenter[] = [];

    for (let i = 0; i < elements.length - 1; i++) {
      const element = elements[i];
      const nextElement = elements[i + 1];

      distances.push(
        new constructors.distanceConstraint(element, nextElement, {
          anchorOne: 1,
          anchorTwo: 0,
          distance: options.distance,
          power: options.power,
        }),
      );

      proportions.push(
        new constructors.proportionConstraint(element, nextElement, {
          power: options.power,
        }),
      );

      if (options.keepAlignment !== false) {
        centers.push(
          new constructors.centerDistanceConstraint(element, nextElement, {
            power: options.power,
            anchorOne: 0,
            anchorTwo: 0,
          }),
        );
      }
    }

    const dummyResult = this.buildDummy(
      elements[0],
      elements[elements.length - 1],
    );

    return {
      dummy: dummyResult.dummy,
      dummyHorizontalConstraints: dummyResult.horizontalConstraints,
      dummyVerticalConstraints: dummyResult.verticalConstraints,
      distanceConstraints: distances,
      proportionConstraints: proportions,
      alignmentConstraints: centers,
    };
  }

  private static buildDummy(
    firstElement: UIElement,
    lastElement: UIElement,
  ): {
    dummy: UIDummy;
    horizontalConstraints: UIHorizontalDistanceConstraint[];
    verticalConstraints: UIVerticalDistanceConstraint[];
  } {
    const dummy = new UIDummy(lastElement.layer);

    return {
      dummy,
      horizontalConstraints: [
        new UIHorizontalDistanceConstraint(dummy, firstElement, {
          distance: 0,
          anchorOne: 0,
          anchorTwo: 0,
        }),
        new UIHorizontalDistanceConstraint(dummy, lastElement, {
          distance: 0,
          anchorOne: 1,
          anchorTwo: 1,
        }),
      ],
      verticalConstraints: [
        new UIVerticalDistanceConstraint(dummy, firstElement, {
          distance: 0,
          anchorOne: 0,
          anchorTwo: 0,
        }),
        new UIVerticalDistanceConstraint(dummy, lastElement, {
          distance: 0,
          anchorOne: 1,
          anchorTwo: 1,
        }),
      ],
    };
  }
}

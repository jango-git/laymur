import { UIHorizontalDistanceConstraint } from "../../constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../../constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../../constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../../constraints/UIVerticalProportionConstraint";
import { assertValidNumber } from "../../miscellaneous/asserts";
import type {
  UILayerElement,
  UIPlaneElement,
} from "../../miscellaneous/shared";
import { UIPriority } from "../../miscellaneous/UIPriority";
import { UIRelation } from "../../miscellaneous/UIRelation";
import { UIAspectConstraint } from "../UIAspectConstraint";
import type { UIFitConstraintBuilderOptions } from "./UIFitConstraintBuilder.Internal";
import { DEFAULT_ANCHOR } from "./UIFitConstraintBuilder.Internal";

/** Builder for fit layout (like CSS object-fit: contain) */
export class UIFitConstraintBuilder {
  /**
   * Creates fit layout constraints.
   * @param passive Container element
   * @param active Content element that fits within container
   * @param options Fit configuration
   * @returns Created constraints
   */
  public static build(
    passive: UIPlaneElement,
    active: UIPlaneElement & UILayerElement,
    options: Partial<UIFitConstraintBuilderOptions> = {},
  ): {
    /** Aspect constraint if keepActiveAspect is true */
    activeAspectConstraint?: UIAspectConstraint;
    /** Horizontal position constraint */
    xConstraint: UIHorizontalDistanceConstraint;
    /** Vertical position constraint */
    yConstraint: UIVerticalDistanceConstraint;
    /** Width constraint (ensures fitting) */
    widthConstraint: UIHorizontalProportionConstraint;
    /** Height constraint (ensures fitting) */
    heightConstraint: UIVerticalProportionConstraint;
  } {
    if (options.anchorH !== undefined) {
      assertValidNumber(
        options.anchorH,
        "UIFitConstraintBuilder.build.anchorH",
      );
    }
    if (options.anchorV !== undefined) {
      assertValidNumber(
        options.anchorV,
        "UIFitConstraintBuilder.build.anchorV",
      );
    }

    let activeAspectConstraint: UIAspectConstraint | undefined;
    if (options.keepActiveAspect === true) {
      activeAspectConstraint = new UIAspectConstraint(active, {
        orientation: options.orientation,
      });
    }

    const xConstraint = new UIHorizontalDistanceConstraint(passive, active, {
      anchorA: options.anchorH ?? DEFAULT_ANCHOR,
      anchorB: options.anchorH ?? DEFAULT_ANCHOR,
      orientation: options.orientation,
    });

    const yConstraint = new UIVerticalDistanceConstraint(passive, active, {
      anchorA: options.anchorV ?? DEFAULT_ANCHOR,
      anchorB: options.anchorV ?? DEFAULT_ANCHOR,
      orientation: options.orientation,
    });

    const widthConstraint = new UIHorizontalProportionConstraint(
      passive,
      active,
      {
        proportion: 1,
        relation: UIRelation.LESS_THAN,
        orientation: options.orientation,
      },
    );

    const heightConstraint = new UIVerticalProportionConstraint(
      passive,
      active,
      {
        proportion: 1,
        priority: UIPriority.P1,
        orientation: options.orientation,
      },
    );

    return {
      activeAspectConstraint,
      xConstraint,
      yConstraint,
      widthConstraint,
      heightConstraint,
    };
  }
}

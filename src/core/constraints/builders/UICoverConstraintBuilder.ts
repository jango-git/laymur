import { assertValidNumber } from "../../miscellaneous/asserts.js";
import type { UILayerElement, UIPlaneElement } from "../../miscellaneous/shared.js";
import { UIPriority } from "../../miscellaneous/UIPriority.js";
import { UIRelation } from "../../miscellaneous/UIRelation.js";
import { UIAspectConstraint } from "../UIAspectConstraint/UIAspectConstraint.js";
import { UIHorizontalDistanceConstraint } from "../UIHorizontalDistanceConstraint/UIHorizontalDistanceConstraint.js";
import { UIHorizontalProportionConstraint } from "../UIHorizontalProportionConstraint/UIHorizontalProportionConstraint.js";
import { UIVerticalDistanceConstraint } from "../UIVerticalDistanceConstraint/UIVerticalDistanceConstraint.js";
import { UIVerticalProportionConstraint } from "../UIVerticalProportionConstraint/UIVerticalProportionConstraint.js";
import type { UICoverConstraintBuilderOptions } from "./UICoverConstraintBuilder.Internal.js";
import { COVER_CONSTRAINT_DEFAULT_ANCHOR } from "./UICoverConstraintBuilder.Internal.js";

/** Builder for cover layout (like CSS object-fit: cover) */
export class UICoverConstraintBuilder {
  /**
   * Creates cover layout constraints.
   * @param passive Container element
   * @param active Content element that covers container
   * @param options Cover configuration
   * @returns Created constraints
   */
  public static build(
    passive: UIPlaneElement,
    active: UIPlaneElement & UILayerElement,
    options: Partial<UICoverConstraintBuilderOptions> = {},
  ): {
    /** Aspect constraint if keepActiveAspect is true */
    activeAspectConstraint?: UIAspectConstraint;
    /** Horizontal position constraint */
    xConstraint: UIHorizontalDistanceConstraint;
    /** Vertical position constraint */
    yConstraint: UIVerticalDistanceConstraint;
    /** Width constraint (ensures coverage) */
    widthConstraint: UIHorizontalProportionConstraint;
    /** Height constraint (ensures coverage) */
    heightConstraint: UIVerticalProportionConstraint;
  } {
    if (options.anchorH !== undefined) {
      assertValidNumber(options.anchorH, "UICoverConstraintBuilder.build.anchorH");
    }
    if (options.anchorV !== undefined) {
      assertValidNumber(options.anchorV, "UICoverConstraintBuilder.build.anchorV");
    }

    let activeAspectConstraint: UIAspectConstraint | undefined;
    if (options.keepActiveAspect !== false) {
      activeAspectConstraint = new UIAspectConstraint(active, {
        orientation: options.orientation,
      });
    }

    const xConstraint = new UIHorizontalDistanceConstraint(passive, active, {
      anchorA: options.anchorH ?? COVER_CONSTRAINT_DEFAULT_ANCHOR,
      anchorB: options.anchorH ?? COVER_CONSTRAINT_DEFAULT_ANCHOR,
      orientation: options.orientation,
    });

    const yConstraint = new UIVerticalDistanceConstraint(passive, active, {
      anchorA: options.anchorV ?? COVER_CONSTRAINT_DEFAULT_ANCHOR,
      anchorB: options.anchorV ?? COVER_CONSTRAINT_DEFAULT_ANCHOR,
      orientation: options.orientation,
    });

    const widthConstraint = new UIHorizontalProportionConstraint(passive, active, {
      proportion: 1,
      relation: UIRelation.GREATER_THAN,
      orientation: options.orientation,
    });

    const heightConstraint = new UIVerticalProportionConstraint(passive, active, {
      proportion: 1,
      priority: UIPriority.P1,
      orientation: options.orientation,
    });

    return {
      activeAspectConstraint,
      xConstraint,
      yConstraint,
      widthConstraint,
      heightConstraint,
    };
  }
}

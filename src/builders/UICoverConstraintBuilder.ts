import { UIAspectConstraint } from "../constraints/UIAspectConstraint";
import { UIHorizontalDistanceConstraint } from "../constraints/UIHorizontalDistanceConstraint";
import { UIHorizontalProportionConstraint } from "../constraints/UIHorizontalProportionConstraint";
import { UIVerticalDistanceConstraint } from "../constraints/UIVerticalDistanceConstraint";
import { UIVerticalProportionConstraint } from "../constraints/UIVerticalProportionConstraint";
import type { UILayerElement, UIPlaneElement } from "../miscellaneous/asserts";
import { type UIOrientation } from "../miscellaneous/UIOrientation";
import { UIPriority } from "../miscellaneous/UIPriority";
import { UIRelation } from "../miscellaneous/UIRelation";

const DEFAULT_ANCHOR = 0.5;

/**
 * Configuration options for the UICoverConstraintBuilder.
 *
 * @public
 */
export interface UICoverConstraintBuilderOptions {
  /** Whether to maintain the aspect ratio of the active (content) element */
  keepActiveAspect: boolean;
  /** Horizontal anchor point (0.0 = left, 0.5 = center, 1.0 = right) */
  anchorH: number;
  /** Vertical anchor point (0.0 = bottom, 0.5 = center, 1.0 = top) */
  anchorV: number;
  /** Orientation context for constraint calculations */
  orientation: UIOrientation;
}

/**
 * Builder for creating "cover" layout constraints.
 *
 * Makes the active element large enough to cover the passive element while
 * maintaining proportions. Similar to CSS `background-size: cover` behavior.
 *
 * The active element is positioned at the specified anchor point and sized to
 * be at least as large as the passive element in both dimensions.
 *
 * @public
 */
export class UICoverConstraintBuilder {
  /**
   * Creates constraints for cover layout behavior.
   *
   * @param passive - Container element (what gets covered)
   * @param active - Content element (what does the covering)
   * @param options - Configuration options for the cover layout
   * @returns Object containing all created constraints
   */
  public static build(
    passive: UIPlaneElement,
    active: UIPlaneElement & UILayerElement,
    options: Partial<UICoverConstraintBuilderOptions> = {},
  ): {
    /** Aspect constraint for the active element (if keepActiveAspect is true) */
    activeAspectConstraint?: UIAspectConstraint;
    /** Horizontal positioning constraint */
    xConstraint: UIHorizontalDistanceConstraint;
    /** Vertical positioning constraint */
    yConstraint: UIVerticalDistanceConstraint;
    /** Width proportion constraint (ensures coverage) */
    widthConstraint: UIHorizontalProportionConstraint;
    /** Height proportion constraint (ensures coverage) */
    heightConstraint: UIVerticalProportionConstraint;
  } {
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
        relation: UIRelation.GREATER_THAN,
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

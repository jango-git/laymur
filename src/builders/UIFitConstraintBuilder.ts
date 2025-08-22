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
 * Configuration options for the UIFitConstraintBuilder.
 */
export interface UIFitConstraintBuilderOptions {
  /** Whether to maintain the aspect ratio of the active (content) element */
  keepActiveAspect: boolean;
  /** Horizontal anchor point (0.0 = left, 0.5 = center, 1.0 = right) */
  anchorH: number;
  /** Vertical anchor point (0.0 = top, 0.5 = center, 1.0 = bottom) */
  anchorV: number;
  /** Orientation context for constraint calculations */
  orientation: UIOrientation;
}

/**
 * Builder for creating "fit" layout constraints that make an element fit within its container.
 *
 * Fit layout ensures the active element is sized to completely fit within the passive
 * element while maintaining proportions. This is similar to CSS `background-size: contain`
 * or `object-fit: contain` behavior.
 *
 * The active element will be:
 * - Positioned at the specified anchor point within the passive element
 * - Sized to fit entirely within the passive element in both dimensions
 * - Scaled proportionally to maintain aspect ratio (if enabled)
 *
 * The constraints ensure: passive.dimension * 1 ≥ active.dimension (active fits within passive)
 */
export class UIFitConstraintBuilder {
  /**
   * Creates a set of constraints for fit layout behavior.
   *
   * @param passive - The container element (what contains the content)
   * @param active - The content element (what gets fitted within the container)
   * @param options - Configuration options for the fit layout
   * @returns Object containing all created constraints
   */
  public static build(
    passive: UIPlaneElement,
    active: UIPlaneElement & UILayerElement,
    options: Partial<UIFitConstraintBuilderOptions> = {},
  ): {
    /** Aspect constraint for the active element (if keepActiveAspect is true) */
    activeAspectConstraint?: UIAspectConstraint;
    /** Horizontal positioning constraint */
    xConstraint: UIHorizontalDistanceConstraint;
    /** Vertical positioning constraint */
    yConstraint: UIVerticalDistanceConstraint;
    /** Width proportion constraint (ensures fitting) */
    widthConstraint: UIHorizontalProportionConstraint;
    /** Height proportion constraint (ensures fitting) */
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

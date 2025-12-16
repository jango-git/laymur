import type { UIOrientation } from "../../miscellaneous/UIOrientation";

export const DEFAULT_ANCHOR = 0.5;

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

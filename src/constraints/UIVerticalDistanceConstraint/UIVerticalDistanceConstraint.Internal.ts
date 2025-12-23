import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal";

export const DEFAULT_ANCHOR = 0.5;

/** Vertical distance constraint options */
export interface UIVerticalDistanceConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Anchor on element A (0 = bottom, 0.5 = center, 1 = top) */
  anchorA: number;
  /** Anchor on element B (0 = bottom, 0.5 = center, 1 = top) */
  anchorB: number;
  /** Distance in world units */
  distance: number;
}

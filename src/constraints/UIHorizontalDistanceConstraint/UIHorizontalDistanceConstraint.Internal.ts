import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal";

export const DEFAULT_ANCHOR = 0.5;

/** Horizontal distance constraint options */
export interface UIHorizontalDistanceConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Anchor on element A (0 = left, 0.5 = center, 1 = right) */
  anchorA: number;
  /** Anchor on element B (0 = left, 0.5 = center, 1 = right) */
  anchorB: number;
  /** Distance in world units */
  distance: number;
}

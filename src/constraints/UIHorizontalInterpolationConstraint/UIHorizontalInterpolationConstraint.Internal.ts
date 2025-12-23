import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal";

export const DEFAULT_ANCHOR = 0.5;
export const DEFAULT_T = 0.5;

/** Horizontal interpolation constraint options */
export interface UIHorizontalInterpolationConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Anchor on element A (0 = left, 0.5 = center, 1 = right) */
  anchorA: number;
  /** Anchor on element B (0 = left, 0.5 = center, 1 = right) */
  anchorB: number;
  /** Anchor on element C (0 = left, 0.5 = center, 1 = right) */
  anchorC: number;
  /** Interpolation factor (0 = A position, 1 = B position) */
  t: number;
}

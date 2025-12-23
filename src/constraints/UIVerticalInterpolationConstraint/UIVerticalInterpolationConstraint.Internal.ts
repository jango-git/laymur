import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint.Internal";

export const DEFAULT_ANCHOR = 0.5;
export const DEFAULT_T = 0.5;

/** Vertical interpolation constraint options */
export interface UIVerticalInterpolationConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Anchor on element A (0 = bottom, 0.5 = center, 1 = top) */
  anchorA: number;
  /** Anchor on element B (0 = bottom, 0.5 = center, 1 = top) */
  anchorB: number;
  /** Anchor on element C (0 = bottom, 0.5 = center, 1 = top) */
  anchorC: number;
  /** Interpolation factor (0 = A position, 1 = B position) */
  t: number;
}

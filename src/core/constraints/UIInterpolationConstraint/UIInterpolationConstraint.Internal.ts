import { assertValidNumber } from "../../miscellaneous/asserts.js";
import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal.js";

export const DEFAULT_T = 0.5;

/** Interpolation constraint options */
export interface UIInterpolationConstraintOptions extends UISingleParameterConstraintOptions {
  /** Anchor on element A (0 = left or bottom, 0.5 = center, 1 = right or top) */
  anchorA: number;
  /** Anchor on element B (0 = left or bottom, 0.5 = center, 1 = right or top) */
  anchorB: number;
  /** Anchor on element C (0 = left or bottom, 0.5 = center, 1 = right or top) */
  anchorC: number;
  /** Interpolation factor (0 = A position, 1 = B position) */
  t: number;
}

/**
 * Validates the given interpolation constraint options.
 * @param options Options to validate
 * @throws If an anchor or the interpolation factor is not a finite number
 */
export function assertValidInterpolationConstraintOptions(
  options: Partial<UIInterpolationConstraintOptions>,
): void {
  if (process.env.NODE_ENV !== "production") {
    if (options.anchorA !== undefined) {
      assertValidNumber(options.anchorA, "UIInterpolationConstraint.constructor.options.anchorA");
    }
    if (options.anchorB !== undefined) {
      assertValidNumber(options.anchorB, "UIInterpolationConstraint.constructor.options.anchorB");
    }
    if (options.anchorC !== undefined) {
      assertValidNumber(options.anchorC, "UIInterpolationConstraint.constructor.options.anchorC");
    }
    if (options.t !== undefined) {
      assertValidNumber(options.t, "UIInterpolationConstraint.constructor.options.t");
    }
  }
}

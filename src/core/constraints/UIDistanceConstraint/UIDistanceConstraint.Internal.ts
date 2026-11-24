import { assertValidNumber } from "../../miscellaneous/asserts.js";
import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal.js";

/** Distance constraint options */
export interface UIDistanceConstraintOptions extends UISingleParameterConstraintOptions {
  /** Anchor on element A (0 = left or bottom, 0.5 = center, 1 = right or top) */
  anchorA: number;
  /** Anchor on element B (0 = left or bottom, 0.5 = center, 1 = right or top) */
  anchorB: number;
  /** Distance in world units */
  distance: number;
}

/**
 * Validates the given distance constraint options.
 * @param options Options to validate
 * @throws If an anchor or the distance is not a finite number
 */
export function assertValidDistanceConstraintOptions(
  options: Partial<UIDistanceConstraintOptions>,
): void {
  if (process.env.NODE_ENV !== "production") {
    if (options.anchorA !== undefined) {
      assertValidNumber(options.anchorA, "UIDistanceConstraint.constructor.options.anchorA");
    }
    if (options.anchorB !== undefined) {
      assertValidNumber(options.anchorB, "UIDistanceConstraint.constructor.options.anchorB");
    }
    if (options.distance !== undefined) {
      assertValidNumber(options.distance, "UIDistanceConstraint.constructor.options.distance");
    }
  }
}

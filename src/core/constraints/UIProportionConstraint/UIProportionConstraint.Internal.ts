import { assertValidPositiveNumber } from "../../miscellaneous/asserts.js";
import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal.js";

/** Proportion constraint options */
export interface UIProportionConstraintOptions extends UISingleParameterConstraintOptions {
  /** Proportion multiplier (size of A * proportion = size of B) */
  proportion: number;
}

/**
 * Validates the given proportion constraint options.
 * @param options Options to validate
 * @throws If the proportion is not a positive number
 */
export function assertValidProportionConstraintOptions(
  options: Partial<UIProportionConstraintOptions>,
): void {
  if (process.env.NODE_ENV !== "production") {
    if (options.proportion !== undefined) {
      assertValidPositiveNumber(
        options.proportion,
        "UIProportionConstraint.constructor.options.proportion",
      );
    }
  }
}

import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal.js";

/** Horizontal proportion constraint options */
export interface UIHorizontalProportionConstraintOptions extends UISingleParameterConstraintOptions {
  /** Proportion multiplier (A.width * proportion = B.width) */
  proportion: number;
}

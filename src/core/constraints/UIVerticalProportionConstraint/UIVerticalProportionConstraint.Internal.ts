import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal";

/** Vertical proportion constraint options */
export interface UIVerticalProportionConstraintOptions extends UISingleParameterConstraintOptions {
  /** Proportion multiplier (A.height * proportion = B.height) */
  proportion: number;
}

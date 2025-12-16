import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

/** Horizontal proportion constraint options */
export interface UIHorizontalProportionConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Proportion multiplier (A.width * proportion = B.width) */
  proportion: number;
}

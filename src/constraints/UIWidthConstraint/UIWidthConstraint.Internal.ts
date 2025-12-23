import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal";

/** Width constraint options */
export interface UIWidthConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Target width in world units */
  width: number;
}

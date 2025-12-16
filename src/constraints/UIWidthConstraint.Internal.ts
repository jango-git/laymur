import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

/** Width constraint options */
export interface UIWidthConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Target width in world units */
  width: number;
}

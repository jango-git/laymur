import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal";

/** Height constraint options */
export interface UIHeightConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Target height in world units */
  height: number;
}

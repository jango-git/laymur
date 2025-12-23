import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint.Internal";

/** Aspect constraint options */
export interface UIAspectConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Target aspect ratio (width/height) */
  aspect: number;
}

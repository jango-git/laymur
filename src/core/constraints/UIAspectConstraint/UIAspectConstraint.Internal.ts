import type { UISingleParameterConstraintOptions } from "../UISingleParameterConstraint/UISingleParameterConstraint.Internal.js";

/** Aspect constraint options */
export interface UIAspectConstraintOptions extends UISingleParameterConstraintOptions {
  /** Target aspect ratio (width/height) */
  aspect: number;
}

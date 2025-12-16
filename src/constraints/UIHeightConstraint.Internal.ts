import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

/**
 * Configuration options for UIHeightConstraint creation.
 */
export interface UIHeightConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The desired height value for the element. */
  height: number;
}

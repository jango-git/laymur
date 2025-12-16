import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

/**
 * Configuration options for UIWidthConstraint creation.
 */
export interface UIWidthConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The desired width value for the element. */
  width: number;
}

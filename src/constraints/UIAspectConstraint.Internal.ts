import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

/**
 * Configuration options for UIAspectConstraint creation.
 */
export interface UIAspectConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The desired aspect ratio (width/height) for the element. */
  aspect: number;
}

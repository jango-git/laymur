import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

/** Default anchor point (0.5 = center) for elements when not specified. */
export const DEFAULT_ANCHOR = 0.5;

/**
 * Configuration options for UIHorizontalDistanceConstraint creation.
 */
export interface UIHorizontalDistanceConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Anchor point for element A (0.0 = left edge, 0.5 = center, 1.0 = right edge). */
  anchorA: number;
  /** Anchor point for element B (0.0 = left edge, 0.5 = center, 1.0 = right edge). */
  anchorB: number;
  /** The desired horizontal distance between the elements. */
  distance: number;
}

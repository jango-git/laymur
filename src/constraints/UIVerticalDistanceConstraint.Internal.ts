import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

/** Default anchor point (0.5 = center) for elements when not specified. */
export const DEFAULT_ANCHOR = 0.5;

/**
 * Configuration options for UIVerticalDistanceConstraint creation.
 */
export interface UIVerticalDistanceConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Anchor point for element A (0.0 = top edge, 0.5 = center, 1.0 = bottom edge). */
  anchorA: number;
  /** Anchor point for element B (0.0 = top edge, 0.5 = center, 1.0 = bottom edge). */
  anchorB: number;
  /** The desired vertical distance between the elements. */
  distance: number;
}

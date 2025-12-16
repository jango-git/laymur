import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

/**
 * Configuration options for UIHorizontalProportionConstraint creation.
 */
export interface UIHorizontalProportionConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The proportional relationship between element widths (elementA.width * proportion = elementB.width). */
  proportion: number;
}

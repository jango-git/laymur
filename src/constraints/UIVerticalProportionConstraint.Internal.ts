import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

/**
 * Configuration options for UIVerticalProportionConstraint creation.
 */
export interface UIVerticalProportionConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The proportional relationship between element heights (elementA.height * proportion = elementB.height). */
  proportion: number;
}

import type { UIPlaneElement } from "../../miscellaneous/shared.js";
import { UIProportionConstraint } from "../UIProportionConstraint/UIProportionConstraint.js";
import type { UIHorizontalProportionConstraintOptions } from "./UIHorizontalProportionConstraint.Internal.js";

/** Maintains proportional width relationship (A.width * proportion = B.width) */
export class UIHorizontalProportionConstraint extends UIProportionConstraint {
  /**
   * @param a First element
   * @param b Second element
   * @param options Proportion configuration
   */
  constructor(
    a: UIPlaneElement,
    b: UIPlaneElement,
    options: Partial<UIHorizontalProportionConstraintOptions> = {},
  ) {
    super(a, b, options, false);
  }
}

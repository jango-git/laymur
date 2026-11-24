import type { UIPlaneElement } from "../../miscellaneous/shared.js";
import { UIProportionConstraint } from "../UIProportionConstraint/UIProportionConstraint.js";
import type { UIVerticalProportionConstraintOptions } from "./UIVerticalProportionConstraint.Internal.js";

/** Maintains proportional height relationship (A.height * proportion = B.height) */
export class UIVerticalProportionConstraint extends UIProportionConstraint {
  /**
   * @param a First element
   * @param b Second element
   * @param options Proportion configuration
   */
  constructor(
    a: UIPlaneElement,
    b: UIPlaneElement,
    options: Partial<UIVerticalProportionConstraintOptions> = {},
  ) {
    super(a, b, options, true);
  }
}

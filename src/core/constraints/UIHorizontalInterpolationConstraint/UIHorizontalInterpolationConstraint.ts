import type { UIPlaneElement, UIPointElement } from "../../miscellaneous/shared.js";
import { UIInterpolationConstraint } from "../UIInterpolationConstraint/UIInterpolationConstraint.js";
import type { UIHorizontalInterpolationConstraintOptions } from "./UIHorizontalInterpolationConstraint.Internal.js";

/** Positions element C horizontally between A and B based on interpolation factor */
export class UIHorizontalInterpolationConstraint extends UIInterpolationConstraint {
  /**
   * @param a First element
   * @param b Second element
   * @param c Element to position between A and B
   * @param options Interpolation configuration
   */
  constructor(
    a: UIPointElement | UIPlaneElement,
    b: UIPointElement | UIPlaneElement,
    c: UIPointElement | UIPlaneElement,
    options: Partial<UIHorizontalInterpolationConstraintOptions> = {},
  ) {
    super(a, b, c, options, false);
  }
}

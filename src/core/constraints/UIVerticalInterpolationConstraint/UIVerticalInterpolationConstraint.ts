import type { UIPlaneElement, UIPointElement } from "../../miscellaneous/shared.js";
import { UIInterpolationConstraint } from "../UIInterpolationConstraint/UIInterpolationConstraint.js";
import type { UIVerticalInterpolationConstraintOptions } from "./UIVerticalInterpolationConstraint.Internal.js";

/** Positions element C vertically between A and B based on interpolation factor */
export class UIVerticalInterpolationConstraint extends UIInterpolationConstraint {
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
    options: Partial<UIVerticalInterpolationConstraintOptions> = {},
  ) {
    super(a, b, c, options, true);
  }
}

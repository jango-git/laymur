import type { UIPlaneElement, UIPointElement } from "../../miscellaneous/shared.js";
import { UIDistanceConstraint } from "../UIDistanceConstraint/UIDistanceConstraint.js";
import type { UIHorizontalDistanceConstraintOptions } from "./UIHorizontalDistanceConstraint.Internal.js";

/** Maintains horizontal distance between elements with configurable anchors */
export class UIHorizontalDistanceConstraint extends UIDistanceConstraint {
  /**
   * @param a First element
   * @param b Second element
   * @param options Distance configuration
   */
  constructor(
    a: UIPointElement | UIPlaneElement,
    b: UIPointElement | UIPlaneElement,
    options: Partial<UIHorizontalDistanceConstraintOptions> = {},
  ) {
    super(a, b, options, false);
  }
}

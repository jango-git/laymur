import type { UIPlaneElement, UIPointElement } from "../../miscellaneous/shared.js";
import { UIDistanceConstraint } from "../UIDistanceConstraint/UIDistanceConstraint.js";
import type { UIVerticalDistanceConstraintOptions } from "./UIVerticalDistanceConstraint.Internal.js";

/** Maintains vertical distance between elements with configurable anchors */
export class UIVerticalDistanceConstraint extends UIDistanceConstraint {
  /**
   * @param a First element
   * @param b Second element
   * @param options Distance configuration
   */
  constructor(
    a: UIPointElement | UIPlaneElement,
    b: UIPointElement | UIPlaneElement,
    options: Partial<UIVerticalDistanceConstraintOptions> = {},
  ) {
    super(a, b, options, true);
  }
}

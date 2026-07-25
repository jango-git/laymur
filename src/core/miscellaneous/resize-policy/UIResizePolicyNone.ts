import { assertValidPositiveNumber } from "../asserts.js";
import { UIResizePolicy } from "./UIResizePolicy.js";

/** No scaling. Always returns 1. */
export class UIResizePolicyNone extends UIResizePolicy {
  public calculateScale(width: number, height: number): number {
    assertValidPositiveNumber(width, "UIResizePolicyNone.calculateScale.width");
    assertValidPositiveNumber(height, "UIResizePolicyNone.calculateScale.height");
    return 1;
  }
}

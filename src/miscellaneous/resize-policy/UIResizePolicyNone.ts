import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** No scaling, always returns 1. */
export class UIResizePolicyNone extends UIResizePolicy {
  public calculateScale(width: number, height: number): number {
    assertValidPositiveNumber(width, "UIResizePolicyNone.calculateScale.width");
    assertValidPositiveNumber(
      height,
      "UIResizePolicyNone.calculateScale.height",
    );
    return 1;
  }
}

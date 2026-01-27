import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** Scales area to fit around rect preserving proportions */
export class UIResizePolicyFit extends UIResizePolicy {
  private rectWidthInternal: number;
  private rectHeightInternal: number;

  /**
   * Creates fit resize policy.
   *
   * @param rectWidth - Target rect width
   * @param rectHeight - Target rect height
   */
  constructor(rectWidth: number, rectHeight: number) {
    super();
    assertValidPositiveNumber(rectWidth, "UIResizePolicyFit.constructor.rectWidth");
    assertValidPositiveNumber(rectHeight, "UIResizePolicyFit.constructor.rectHeight");

    this.rectWidthInternal = rectWidth;
    this.rectHeightInternal = rectHeight;
  }

  /** Target rect width */
  public get rectWidth(): number {
    return this.rectWidthInternal;
  }

  /** Target rect height */
  public get rectHeight(): number {
    return this.rectHeightInternal;
  }

  /** Target rect width */
  public set rectWidth(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyFit.rectWidth");
    if (value !== this.rectWidthInternal) {
      this.rectWidthInternal = value;
      this.dirty = true;
    }
  }

  /** Target rect height */
  public set rectHeight(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyFit.rectHeight");
    if (value !== this.rectHeightInternal) {
      this.rectHeightInternal = value;
      this.dirty = true;
    }
  }

  public calculateScale(width: number, height: number): number {
    assertValidPositiveNumber(width, "UIResizePolicyFit.calculateScale.width");
    assertValidPositiveNumber(height, "UIResizePolicyFit.calculateScale.height");
    return Math.max(this.rectWidthInternal / width, this.rectHeightInternal / height);
  }
}

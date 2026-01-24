import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** Scales area to cover rect preserving proportions */
export class UIResizePolicyCover extends UIResizePolicy {
  private rectWidthInternal: number;
  private rectHeightInternal: number;

  /**
   * Creates cover resize policy.
   *
   * @param rectWidth - Target rect width
   * @param rectHeight - Target rect height
   */
  constructor(rectWidth: number, rectHeight: number) {
    super();
    assertValidPositiveNumber(rectWidth, "UIResizePolicyCover.constructor.rectWidth");
    assertValidPositiveNumber(rectHeight, "UIResizePolicyCover.constructor.rectHeight");

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
    assertValidPositiveNumber(value, "UIResizePolicyCover.rectWidth");
    if (value !== this.rectWidthInternal) {
      this.rectWidthInternal = value;
      this.dirty = true;
    }
  }

  /** Target rect height */
  public set rectHeight(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCover.rectHeight");
    if (value !== this.rectHeightInternal) {
      this.rectHeightInternal = value;
      this.dirty = true;
    }
  }

  public calculateScale(width: number, height: number): number {
    assertValidPositiveNumber(width, "UIResizePolicyCover.calculateScale.width");
    assertValidPositiveNumber(height, "UIResizePolicyCover.calculateScale.height");
    return Math.min(this.rectWidthInternal / width, this.rectHeightInternal / height);
  }
}

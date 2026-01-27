import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** Scales by height in landscape, by width in portrait */
export class UIResizePolicyCrossInverted extends UIResizePolicy {
  private fixedHeightLandscapeInternal: number;
  private fixedWidthPortraitInternal: number;

  /**
   * Creates inverted cross resize policy.
   *
   * @param fixedHeightLandscape - Target height when landscape
   * @param fixedWidthPortrait - Target width when portrait
   */
  constructor(fixedHeightLandscape: number, fixedWidthPortrait: number) {
    super();
    assertValidPositiveNumber(
      fixedHeightLandscape,
      "UIResizePolicyCrossInverted.constructor.fixedHeightLandscape",
    );
    assertValidPositiveNumber(
      fixedWidthPortrait,
      "UIResizePolicyCrossInverted.constructor.fixedWidthPortrait",
    );

    this.fixedHeightLandscapeInternal = fixedHeightLandscape;
    this.fixedWidthPortraitInternal = fixedWidthPortrait;
  }

  /** Target height when landscape */
  public get fixedHeightLandscape(): number {
    return this.fixedHeightLandscapeInternal;
  }

  /** Target width when portrait */
  public get fixedWidthPortrait(): number {
    return this.fixedWidthPortraitInternal;
  }

  /** Target height when landscape */
  public set fixedHeightLandscape(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCrossInverted.fixedHeightLandscape");
    if (value !== this.fixedHeightLandscapeInternal) {
      this.fixedHeightLandscapeInternal = value;
      this.dirty = true;
    }
  }

  /** Target width when portrait */
  public set fixedWidthPortrait(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCrossInverted.fixedWidthPortrait");
    if (value !== this.fixedWidthPortraitInternal) {
      this.fixedWidthPortraitInternal = value;
      this.dirty = true;
    }
  }

  public calculateScale(width: number, height: number): number {
    assertValidPositiveNumber(width, "UIResizePolicyCrossInverted.calculateScale.width");
    assertValidPositiveNumber(height, "UIResizePolicyCrossInverted.calculateScale.height");
    return width > height
      ? this.fixedHeightLandscapeInternal / height
      : this.fixedWidthPortraitInternal / width;
  }
}

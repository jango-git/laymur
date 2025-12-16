import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** Scales by width in landscape, by height in portrait */
export class UIResizePolicyCross extends UIResizePolicy {
  private fixedWidthLandscapeInternal: number;
  private fixedHeightPortraitInternal: number;

  /**
   * Creates cross resize policy.
   *
   * @param fixedWidthLandscape - Target width when landscape
   * @param fixedHeightPortrait - Target height when portrait
   */
  constructor(fixedWidthLandscape: number, fixedHeightPortrait: number) {
    super();
    assertValidPositiveNumber(
      fixedWidthLandscape,
      "UIResizePolicyCross.constructor.fixedWidthLandscape",
    );
    assertValidPositiveNumber(
      fixedHeightPortrait,
      "UIResizePolicyCross.constructor.fixedHeightPortrait",
    );

    this.fixedWidthLandscapeInternal = fixedWidthLandscape;
    this.fixedHeightPortraitInternal = fixedHeightPortrait;
  }

  /** Target width when landscape */
  public get fixedWidthLandscape(): number {
    return this.fixedWidthLandscapeInternal;
  }

  /** Target height when portrait */
  public get fixedHeightPortrait(): number {
    return this.fixedHeightPortraitInternal;
  }

  /** Target width when landscape */
  public set fixedWidthLandscape(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCross.fixedWidthLandscape");
    if (value !== this.fixedWidthLandscapeInternal) {
      this.fixedWidthLandscapeInternal = value;
      this.dirty = true;
    }
  }

  /** Target height when portrait */
  public set fixedHeightPortrait(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCross.fixedHeightPortrait");
    if (value !== this.fixedHeightPortraitInternal) {
      this.fixedHeightPortraitInternal = value;
      this.dirty = true;
    }
  }

  public calculateScale(width: number, height: number): number {
    assertValidPositiveNumber(
      width,
      "UIResizePolicyCross.calculateScale.width",
    );
    assertValidPositiveNumber(
      height,
      "UIResizePolicyCross.calculateScale.height",
    );
    return width > height
      ? this.fixedWidthLandscapeInternal / width
      : this.fixedHeightPortraitInternal / height;
  }
}

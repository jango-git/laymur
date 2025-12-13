import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** Scales by width in landscape, by height in portrait. */
export class UIResizePolicyCross extends UIResizePolicy {
  private fixedWidthLandscapeInternal: number;
  private fixedHeightPortraitInternal: number;

  constructor(fixedWidthLandscape: number, fixedHeightPortrait: number) {
    super();
    assertValidPositiveNumber(
      fixedWidthLandscape,
      "UIResizePolicyCross.fixedWidthLandscape",
    );
    assertValidPositiveNumber(
      fixedHeightPortrait,
      "UIResizePolicyCross.fixedHeightPortrait",
    );

    this.fixedWidthLandscapeInternal = fixedWidthLandscape;
    this.fixedHeightPortraitInternal = fixedHeightPortrait;
  }

  /** Fixed width for landscape orientation. */
  public get fixedWidthLandscape(): number {
    return this.fixedWidthLandscapeInternal;
  }

  /** Fixed height for portrait orientation. */
  public get fixedHeightPortrait(): number {
    return this.fixedHeightPortraitInternal;
  }

  public set fixedWidthLandscape(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCross.fixedWidthLandscape");
    if (value !== this.fixedWidthLandscapeInternal) {
      this.fixedWidthLandscapeInternal = value;
      this.dirty = true;
    }
  }

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

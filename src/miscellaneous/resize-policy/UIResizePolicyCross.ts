import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy, UIResizePolicyEvent } from "./UIResizePolicy";

/**
 * Scales by width in landscape, by height in portrait.
 */
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

  public get fixedWidthLandscape(): number {
    return this.fixedWidthLandscapeInternal;
  }
  public get fixedHeightPortrait(): number {
    return this.fixedHeightPortraitInternal;
  }

  public set fixedWidthLandscape(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCross.fixedWidthLandscape");
    if (value !== this.fixedWidthLandscapeInternal) {
      this.fixedWidthLandscapeInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public set fixedHeightPortrait(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCross.fixedHeightPortrait");
    if (value !== this.fixedHeightPortraitInternal) {
      this.fixedHeightPortraitInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public calculateScaleInternal(width: number, height: number): number {
    return width > height
      ? this.fixedWidthLandscapeInternal / width
      : this.fixedHeightPortraitInternal / height;
  }
}

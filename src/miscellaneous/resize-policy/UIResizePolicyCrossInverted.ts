import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** Scales by height in landscape, by width in portrait. */
export class UIResizePolicyCrossInverted extends UIResizePolicy {
  private fixedHeightLandscapeInternal: number;
  private fixedWidthPortraitInternal: number;

  constructor(fixedHeightLandscape: number, fixedWidthPortrait: number) {
    super();
    assertValidPositiveNumber(
      fixedHeightLandscape,
      "UIResizePolicyCrossInverted.fixedHeightLandscape",
    );
    assertValidPositiveNumber(
      fixedWidthPortrait,
      "UIResizePolicyCrossInverted.fixedWidthPortrait",
    );

    this.fixedHeightLandscapeInternal = fixedHeightLandscape;
    this.fixedWidthPortraitInternal = fixedWidthPortrait;
  }

  /** Fixed height for landscape orientation. */
  public get fixedHeightLandscape(): number {
    return this.fixedHeightLandscapeInternal;
  }

  /** Fixed width for portrait orientation. */
  public get fixedWidthPortrait(): number {
    return this.fixedWidthPortraitInternal;
  }

  public set fixedHeightLandscape(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyCrossInverted.fixedHeightLandscape",
    );
    if (value !== this.fixedHeightLandscapeInternal) {
      this.fixedHeightLandscapeInternal = value;
      this.dirty = true;
    }
  }

  public set fixedWidthPortrait(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyCrossInverted.fixedWidthPortrait",
    );
    if (value !== this.fixedWidthPortraitInternal) {
      this.fixedWidthPortraitInternal = value;
      this.dirty = true;
    }
  }

  public calculateScale(width: number, height: number): number {
    assertValidPositiveNumber(
      width,
      "UIResizePolicyCrossInverted.calculateScale.width",
    );
    assertValidPositiveNumber(
      height,
      "UIResizePolicyCrossInverted.calculateScale.height",
    );
    return width > height
      ? this.fixedHeightLandscapeInternal / height
      : this.fixedWidthPortraitInternal / width;
  }
}

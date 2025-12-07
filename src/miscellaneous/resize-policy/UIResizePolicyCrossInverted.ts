import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy, UIResizePolicyEvent } from "./UIResizePolicy";

/**
 * Scales by height in landscape, by width in portrait.
 */
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

  public get fixedHeightLandscape(): number {
    return this.fixedHeightLandscapeInternal;
  }
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
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public set fixedWidthPortrait(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyCrossInverted.fixedWidthPortrait",
    );
    if (value !== this.fixedWidthPortraitInternal) {
      this.fixedWidthPortraitInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  protected calculateScaleInternal(width: number, height: number): number {
    return width > height
      ? this.fixedHeightLandscapeInternal / height
      : this.fixedWidthPortraitInternal / width;
  }
}

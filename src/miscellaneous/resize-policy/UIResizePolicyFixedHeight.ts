import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** Scales based on height with different values for landscape and portrait. */
export class UIResizePolicyFixedHeight extends UIResizePolicy {
  private fixedHeightLandscapeInternal: number;
  private fixedHeightPortraitInternal: number;

  constructor(fixedHeightLandscape: number, fixedHeightPortrait: number) {
    super();
    assertValidPositiveNumber(
      fixedHeightLandscape,
      "UIResizePolicyFixedHeight.constructor.fixedHeightLandscape",
    );
    assertValidPositiveNumber(
      fixedHeightPortrait,
      "UIResizePolicyFixedHeight.constructor.fixedHeightPortrait",
    );

    this.fixedHeightLandscapeInternal = fixedHeightLandscape;
    this.fixedHeightPortraitInternal = fixedHeightPortrait;
  }

  /** Fixed height for landscape orientation. */
  public get fixedHeightLandscape(): number {
    return this.fixedHeightLandscapeInternal;
  }

  /** Fixed height for portrait orientation. */
  public get fixedHeightPortrait(): number {
    return this.fixedHeightPortraitInternal;
  }

  public set fixedHeightLandscape(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyFixedHeight.fixedHeightLandscape",
    );
    if (value !== this.fixedHeightLandscapeInternal) {
      this.fixedHeightLandscapeInternal = value;
      this.dirty = true;
    }
  }

  public set fixedHeightPortrait(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyFixedHeight.fixedHeightPortrait",
    );
    if (value !== this.fixedHeightPortraitInternal) {
      this.fixedHeightPortraitInternal = value;
      this.dirty = true;
    }
  }

  public calculateScale(width: number, height: number): number {
    assertValidPositiveNumber(
      width,
      "UIResizePolicyFixedHeight.calculateScale.width",
    );
    assertValidPositiveNumber(
      height,
      "UIResizePolicyFixedHeight.calculateScale.height",
    );
    return width > height
      ? this.fixedHeightLandscapeInternal / height
      : this.fixedHeightPortraitInternal / height;
  }
}

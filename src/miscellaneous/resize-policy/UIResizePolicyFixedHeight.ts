import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** Scales by height with orientation-specific targets */
export class UIResizePolicyFixedHeight extends UIResizePolicy {
  private fixedHeightLandscapeInternal: number;
  private fixedHeightPortraitInternal: number;

  /**
   * Creates fixed height resize policy.
   *
   * @param fixedHeightLandscape - Target height when landscape
   * @param fixedHeightPortrait - Target height when portrait
   */
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

  /** Target height when landscape */
  public get fixedHeightLandscape(): number {
    return this.fixedHeightLandscapeInternal;
  }

  /** Target height when portrait */
  public get fixedHeightPortrait(): number {
    return this.fixedHeightPortraitInternal;
  }

  /** Target height when landscape */
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

  /** Target height when portrait */
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

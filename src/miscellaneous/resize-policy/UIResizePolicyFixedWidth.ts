import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** Scales by width with orientation-specific targets */
export class UIResizePolicyFixedWidth extends UIResizePolicy {
  private fixedWidthLandscapeInternal: number;
  private fixedWidthPortraitInternal: number;

  /**
   * Creates fixed width resize policy.
   *
   * @param fixedWidthLandscape - Target width when landscape
   * @param fixedWidthPortrait - Target width when portrait
   */
  constructor(fixedWidthLandscape: number, fixedWidthPortrait: number) {
    super();
    assertValidPositiveNumber(
      fixedWidthLandscape,
      "UIResizePolicyFixedWidth.constructor.fixedWidthLandscape",
    );
    assertValidPositiveNumber(
      fixedWidthPortrait,
      "UIResizePolicyFixedWidth.constructor.fixedWidthPortrait",
    );

    this.fixedWidthLandscapeInternal = fixedWidthLandscape;
    this.fixedWidthPortraitInternal = fixedWidthPortrait;
  }

  /** Target width when landscape */
  public get fixedWidthLandscape(): number {
    return this.fixedWidthLandscapeInternal;
  }

  /** Target width when portrait */
  public get fixedWidthPortrait(): number {
    return this.fixedWidthPortraitInternal;
  }

  /** Target width when landscape */
  public set fixedWidthLandscape(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyFixedWidth.fixedWidthLandscape",
    );
    if (value !== this.fixedWidthLandscapeInternal) {
      this.fixedWidthLandscapeInternal = value;
      this.dirty = true;
    }
  }

  /** Target width when portrait */
  public set fixedWidthPortrait(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyFixedWidth.fixedWidthPortrait",
    );
    if (value !== this.fixedWidthPortraitInternal) {
      this.fixedWidthPortraitInternal = value;
      this.dirty = true;
    }
  }

  public calculateScale(width: number, height: number): number {
    assertValidPositiveNumber(
      width,
      "UIResizePolicyFixedWidth.calculateScale.width",
    );
    assertValidPositiveNumber(
      height,
      "UIResizePolicyFixedWidth.calculateScale.height",
    );
    return width > height
      ? this.fixedWidthLandscapeInternal / width
      : this.fixedWidthPortraitInternal / width;
  }
}

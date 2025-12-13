import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy } from "./UIResizePolicy";

/** Scales based on width with different values for landscape and portrait. */
export class UIResizePolicyFixedWidth extends UIResizePolicy {
  private fixedWidthLandscapeInternal: number;
  private fixedWidthPortraitInternal: number;

  constructor(fixedWidthLandscape: number, fixedWidthPortrait: number) {
    super();
    assertValidPositiveNumber(
      fixedWidthLandscape,
      "UIResizePolicyFixedWidth.fixedWidthLandscape",
    );
    assertValidPositiveNumber(
      fixedWidthPortrait,
      "UIResizePolicyFixedWidth.fixedWidthPortrait",
    );

    this.fixedWidthLandscapeInternal = fixedWidthLandscape;
    this.fixedWidthPortraitInternal = fixedWidthPortrait;
  }

  /** Fixed width for landscape orientation. */
  public get fixedWidthLandscape(): number {
    return this.fixedWidthLandscapeInternal;
  }

  /** Fixed width for portrait orientation. */
  public get fixedWidthPortrait(): number {
    return this.fixedWidthPortraitInternal;
  }

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

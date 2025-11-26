import { assertValidPositiveNumber } from "./asserts";
import { UIResizePolicy, UIResizePolicyEvent } from "./UIResizePolicy";

/**
 * Maintains fixed width, scales based on window width.
 *
 * Uses different widths for landscape vs portrait orientation, and optionally
 * a third width for near-square aspect ratios.
 */
export class UIResizePolicyFixedWidth extends UIResizePolicy {
  private fixedWidthLandscapeInternal: number;
  private fixedWidthPortraitInternal: number;
  private fixedWidthSquareInternal: number;
  private squareEpsilonInternal: number;

  constructor(
    fixedWidthLandscape: number,
    fixedWidthPortrait: number,
    fixedWidthSquare: number = fixedWidthPortrait,
    squareEpsilon = 0.1,
  ) {
    super();
    assertValidPositiveNumber(
      fixedWidthLandscape,
      "UIResizePolicyFixedWidth.fixedWidthLandscape",
    );
    assertValidPositiveNumber(
      fixedWidthPortrait,
      "UIResizePolicyFixedWidth.fixedWidthPortrait",
    );
    assertValidPositiveNumber(
      fixedWidthSquare,
      "UIResizePolicyFixedWidth.fixedWidthSquare",
    );
    assertValidPositiveNumber(squareEpsilon, "UIResizePolicy.squareEpsilon");

    this.fixedWidthLandscapeInternal = fixedWidthLandscape;
    this.fixedWidthPortraitInternal = fixedWidthPortrait;
    this.fixedWidthSquareInternal = fixedWidthSquare;
    this.squareEpsilonInternal = squareEpsilon;
  }

  public get fixedWidthLandscape(): number {
    return this.fixedWidthLandscapeInternal;
  }
  public get fixedWidthPortrait(): number {
    return this.fixedWidthPortraitInternal;
  }
  public get fixedWidthSquare(): number {
    return this.fixedWidthSquareInternal;
  }
  public get squareEpsilon(): number {
    return this.squareEpsilonInternal;
  }

  public set fixedWidthLandscape(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyFixedWidth.fixedWidthLandscape",
    );
    if (value !== this.fixedWidthLandscapeInternal) {
      this.fixedWidthLandscapeInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public set fixedWidthPortrait(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyFixedWidth.fixedWidthPortrait",
    );
    if (value !== this.fixedWidthPortraitInternal) {
      this.fixedWidthPortraitInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public set fixedWidthSquare(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyFixedWidth.fixedWidthSquare",
    );
    if (value !== this.fixedWidthSquareInternal) {
      this.fixedWidthSquareInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public set squareEpsilon(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicy.squareEpsilon");
    if (value !== this.squareEpsilonInternal) {
      this.squareEpsilonInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  protected calculateScaleInternal(width: number, height: number): number {
    if (this.isSquare(width, height)) {
      return this.fixedWidthSquareInternal / width;
    }
    return width > height
      ? this.fixedWidthLandscapeInternal / width
      : this.fixedWidthPortraitInternal / width;
  }

  /**
   * Determines if viewport aspect ratio is close to 1:1.
   */
  private isSquare(width: number, height: number): boolean {
    const ratio = width / height;
    return Math.abs(ratio - 1) <= this.squareEpsilonInternal;
  }
}

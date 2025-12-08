import { assertValidPositiveNumber } from "../asserts";
import { UIResizePolicy, UIResizePolicyEvent } from "./UIResizePolicy";

/**
 * Maintains fixed height, scales based on window height.
 *
 * Uses different heights for landscape vs portrait orientation,
 * and optionally for near-square aspect ratios.
 */
export class UIResizePolicyFixedHeight extends UIResizePolicy {
  private fixedHeightLandscapeInternal: number;
  private fixedHeightPortraitInternal: number;
  private fixedHeightSquareInternal: number;
  private squareEpsilonInternal: number;

  constructor(
    fixedHeightLandscape: number,
    fixedHeightPortrait: number,
    fixedHeightSquare: number = fixedHeightPortrait,
    squareEpsilon = 0.1,
  ) {
    super();
    assertValidPositiveNumber(
      fixedHeightLandscape,
      "UIResizePolicyFixedHeight.fixedHeightLandscape",
    );
    assertValidPositiveNumber(
      fixedHeightPortrait,
      "UIResizePolicyFixedHeight.fixedHeightPortrait",
    );
    assertValidPositiveNumber(
      fixedHeightSquare,
      "UIResizePolicyFixedHeight.fixedHeightSquare",
    );
    assertValidPositiveNumber(
      squareEpsilon,
      "UIResizePolicyFixedHeight.constructor.squareEpsilon",
    );

    this.fixedHeightLandscapeInternal = fixedHeightLandscape;
    this.fixedHeightPortraitInternal = fixedHeightPortrait;
    this.fixedHeightSquareInternal = fixedHeightSquare;
    this.squareEpsilonInternal = squareEpsilon;
  }

  public get fixedHeightLandscape(): number {
    return this.fixedHeightLandscapeInternal;
  }
  public get fixedHeightPortrait(): number {
    return this.fixedHeightPortraitInternal;
  }
  public get fixedHeightSquare(): number {
    return this.fixedHeightSquareInternal;
  }
  public get squareEpsilon(): number {
    return this.squareEpsilonInternal;
  }

  public set fixedHeightLandscape(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyFixedHeight.fixedHeightLandscape",
    );
    if (value !== this.fixedHeightLandscapeInternal) {
      this.fixedHeightLandscapeInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public set fixedHeightPortrait(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyFixedHeight.fixedHeightPortrait",
    );
    if (value !== this.fixedHeightPortraitInternal) {
      this.fixedHeightPortraitInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public set fixedHeightSquare(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyFixedHeight.fixedHeightSquare",
    );
    if (value !== this.fixedHeightSquareInternal) {
      this.fixedHeightSquareInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public set squareEpsilon(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyFixedHeight.squareEpsilon");
    if (value !== this.squareEpsilonInternal) {
      this.squareEpsilonInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  protected calculateScaleInternal(width: number, height: number): number {
    if (this.isSquare(width, height)) {
      return this.fixedHeightSquareInternal / height;
    }
    return width > height
      ? this.fixedHeightLandscapeInternal / height
      : this.fixedHeightPortraitInternal / height;
  }

  private isSquare(width: number, height: number): boolean {
    const ratio = width / height;
    return Math.abs(ratio - 1) <= this.squareEpsilonInternal;
  }
}

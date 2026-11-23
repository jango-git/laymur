import type { UILayerOrientation } from "../../layers/UILayer/UILayer.Internal.js";
import { assertValidPositiveNumber } from "../asserts.js";
import { UIOrientation } from "../UIOrientation.js";
import { UIResizePolicy } from "./UIResizePolicy.js";

/** Scales by the shorter side: height in landscape, width in portrait, the shorter one in square */
export class UIResizePolicyCrossInverted extends UIResizePolicy {
  private fixedHeightLandscapeInternal: number;
  private fixedWidthPortraitInternal: number;
  private fixedShorterSideSquareInternal: number | null;

  /**
   * Creates inverted cross resize policy.
   *
   * @param fixedHeightLandscape - Target height when landscape
   * @param fixedWidthPortrait - Target width when portrait
   * @param fixedShorterSideSquare - Target length of the shorter side when square. The portrait
   *   rule applies if omitted
   */
  constructor(
    fixedHeightLandscape: number,
    fixedWidthPortrait: number,
    fixedShorterSideSquare?: number,
  ) {
    super();
    assertValidPositiveNumber(
      fixedHeightLandscape,
      "UIResizePolicyCrossInverted.constructor.fixedHeightLandscape",
    );
    assertValidPositiveNumber(
      fixedWidthPortrait,
      "UIResizePolicyCrossInverted.constructor.fixedWidthPortrait",
    );
    if (fixedShorterSideSquare !== undefined) {
      assertValidPositiveNumber(
        fixedShorterSideSquare,
        "UIResizePolicyCrossInverted.constructor.fixedShorterSideSquare",
      );
    }

    this.fixedHeightLandscapeInternal = fixedHeightLandscape;
    this.fixedWidthPortraitInternal = fixedWidthPortrait;
    this.fixedShorterSideSquareInternal = fixedShorterSideSquare ?? null;
  }

  /** Target height when landscape */
  public get fixedHeightLandscape(): number {
    return this.fixedHeightLandscapeInternal;
  }

  /** Target width when portrait */
  public get fixedWidthPortrait(): number {
    return this.fixedWidthPortraitInternal;
  }

  /** Target length of the shorter side when square; null for the portrait rule */
  public get fixedShorterSideSquare(): number | null {
    return this.fixedShorterSideSquareInternal;
  }

  /** Target height when landscape */
  public set fixedHeightLandscape(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCrossInverted.fixedHeightLandscape");
    if (value !== this.fixedHeightLandscapeInternal) {
      this.fixedHeightLandscapeInternal = value;
      this.markChanged();
    }
  }

  /** Target width when portrait */
  public set fixedWidthPortrait(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCrossInverted.fixedWidthPortrait");
    if (value !== this.fixedWidthPortraitInternal) {
      this.fixedWidthPortraitInternal = value;
      this.markChanged();
    }
  }

  /** Target length of the shorter side when square; null for the portrait rule */
  public set fixedShorterSideSquare(value: number | null) {
    if (value !== null) {
      assertValidPositiveNumber(value, "UIResizePolicyCrossInverted.fixedShorterSideSquare");
    }
    if (value !== this.fixedShorterSideSquareInternal) {
      this.fixedShorterSideSquareInternal = value;
      this.markChanged();
    }
  }

  public calculateScale(width: number, height: number, orientation: UILayerOrientation): number {
    assertValidPositiveNumber(width, "UIResizePolicyCrossInverted.calculateScale.width");
    assertValidPositiveNumber(height, "UIResizePolicyCrossInverted.calculateScale.height");
    if (orientation === UIOrientation.HORIZONTAL) {
      return this.fixedHeightLandscapeInternal / height;
    }
    if (orientation === UIOrientation.SQUARE && this.fixedShorterSideSquareInternal !== null) {
      return this.fixedShorterSideSquareInternal / Math.min(width, height);
    }
    return this.fixedWidthPortraitInternal / width;
  }
}

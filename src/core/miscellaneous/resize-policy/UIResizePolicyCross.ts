import type { UILayerOrientation } from "../../layers/UILayer/UILayer.Internal.js";
import { assertValidPositiveNumber } from "../asserts.js";
import { UIOrientation } from "../UIOrientation.js";
import { UIResizePolicy } from "./UIResizePolicy.js";

/** Scales by the longer side: width in landscape, height in portrait, the longer one in square */
export class UIResizePolicyCross extends UIResizePolicy {
  private fixedWidthLandscapeInternal: number;
  private fixedHeightPortraitInternal: number;
  private fixedLongerSideSquareInternal: number | null;

  /**
   * Creates cross resize policy.
   *
   * @param fixedWidthLandscape - Target width when landscape
   * @param fixedHeightPortrait - Target height when portrait
   * @param fixedLongerSideSquare - Target length of the longer side when square. The portrait
   *   rule applies if omitted
   */
  constructor(
    fixedWidthLandscape: number,
    fixedHeightPortrait: number,
    fixedLongerSideSquare?: number,
  ) {
    super();
    assertValidPositiveNumber(
      fixedWidthLandscape,
      "UIResizePolicyCross.constructor.fixedWidthLandscape",
    );
    assertValidPositiveNumber(
      fixedHeightPortrait,
      "UIResizePolicyCross.constructor.fixedHeightPortrait",
    );
    if (fixedLongerSideSquare !== undefined) {
      assertValidPositiveNumber(
        fixedLongerSideSquare,
        "UIResizePolicyCross.constructor.fixedLongerSideSquare",
      );
    }

    this.fixedWidthLandscapeInternal = fixedWidthLandscape;
    this.fixedHeightPortraitInternal = fixedHeightPortrait;
    this.fixedLongerSideSquareInternal = fixedLongerSideSquare ?? null;
  }

  /** Target width when landscape */
  public get fixedWidthLandscape(): number {
    return this.fixedWidthLandscapeInternal;
  }

  /** Target height when portrait */
  public get fixedHeightPortrait(): number {
    return this.fixedHeightPortraitInternal;
  }

  /** Target length of the longer side when square; null for the portrait rule */
  public get fixedLongerSideSquare(): number | null {
    return this.fixedLongerSideSquareInternal;
  }

  /** Target width when landscape */
  public set fixedWidthLandscape(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCross.fixedWidthLandscape");
    if (value !== this.fixedWidthLandscapeInternal) {
      this.fixedWidthLandscapeInternal = value;
      this.markChanged();
    }
  }

  /** Target height when portrait */
  public set fixedHeightPortrait(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCross.fixedHeightPortrait");
    if (value !== this.fixedHeightPortraitInternal) {
      this.fixedHeightPortraitInternal = value;
      this.markChanged();
    }
  }

  /** Target length of the longer side when square; null for the portrait rule */
  public set fixedLongerSideSquare(value: number | null) {
    if (value !== null) {
      assertValidPositiveNumber(value, "UIResizePolicyCross.fixedLongerSideSquare");
    }
    if (value !== this.fixedLongerSideSquareInternal) {
      this.fixedLongerSideSquareInternal = value;
      this.markChanged();
    }
  }

  public calculateScale(width: number, height: number, orientation: UILayerOrientation): number {
    assertValidPositiveNumber(width, "UIResizePolicyCross.calculateScale.width");
    assertValidPositiveNumber(height, "UIResizePolicyCross.calculateScale.height");
    if (orientation === UIOrientation.HORIZONTAL) {
      return this.fixedWidthLandscapeInternal / width;
    }
    if (orientation === UIOrientation.SQUARE && this.fixedLongerSideSquareInternal !== null) {
      return this.fixedLongerSideSquareInternal / Math.max(width, height);
    }
    return this.fixedHeightPortraitInternal / height;
  }
}

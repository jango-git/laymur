import type { UILayerOrientation } from "../../layers/UILayer/UILayer.Internal.js";
import { assertValidPositiveNumber } from "../asserts.js";
import { UIOrientation } from "../UIOrientation.js";
import { UIResizePolicy } from "./UIResizePolicy.js";

/** Scales by height with orientation-specific targets */
export class UIResizePolicyFixedHeight extends UIResizePolicy {
  private fixedHeightLandscapeInternal: number;
  private fixedHeightPortraitInternal: number;
  private fixedHeightSquareInternal: number | null;

  /**
   * Creates fixed height resize policy.
   *
   * @param fixedHeightLandscape - Target height when landscape
   * @param fixedHeightPortrait - Target height when portrait
   * @param fixedHeightSquare - Target height when square. The portrait rule applies if omitted
   */
  constructor(
    fixedHeightLandscape: number,
    fixedHeightPortrait: number,
    fixedHeightSquare?: number,
  ) {
    super();
    assertValidPositiveNumber(
      fixedHeightLandscape,
      "UIResizePolicyFixedHeight.constructor.fixedHeightLandscape",
    );
    assertValidPositiveNumber(
      fixedHeightPortrait,
      "UIResizePolicyFixedHeight.constructor.fixedHeightPortrait",
    );
    if (fixedHeightSquare !== undefined) {
      assertValidPositiveNumber(
        fixedHeightSquare,
        "UIResizePolicyFixedHeight.constructor.fixedHeightSquare",
      );
    }

    this.fixedHeightLandscapeInternal = fixedHeightLandscape;
    this.fixedHeightPortraitInternal = fixedHeightPortrait;
    this.fixedHeightSquareInternal = fixedHeightSquare ?? null;
  }

  /** Target height when landscape */
  public get fixedHeightLandscape(): number {
    return this.fixedHeightLandscapeInternal;
  }

  /** Target height when portrait */
  public get fixedHeightPortrait(): number {
    return this.fixedHeightPortraitInternal;
  }

  /** Target height when square; null for the portrait rule */
  public get fixedHeightSquare(): number | null {
    return this.fixedHeightSquareInternal;
  }

  /** Target height when landscape */
  public set fixedHeightLandscape(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyFixedHeight.fixedHeightLandscape");
    if (value !== this.fixedHeightLandscapeInternal) {
      this.fixedHeightLandscapeInternal = value;
      this.markChanged();
    }
  }

  /** Target height when portrait */
  public set fixedHeightPortrait(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyFixedHeight.fixedHeightPortrait");
    if (value !== this.fixedHeightPortraitInternal) {
      this.fixedHeightPortraitInternal = value;
      this.markChanged();
    }
  }

  /** Target height when square; null for the portrait rule */
  public set fixedHeightSquare(value: number | null) {
    if (value !== null) {
      assertValidPositiveNumber(value, "UIResizePolicyFixedHeight.fixedHeightSquare");
    }
    if (value !== this.fixedHeightSquareInternal) {
      this.fixedHeightSquareInternal = value;
      this.markChanged();
    }
  }

  public calculateScale(width: number, height: number, orientation: UILayerOrientation): number {
    assertValidPositiveNumber(width, "UIResizePolicyFixedHeight.calculateScale.width");
    assertValidPositiveNumber(height, "UIResizePolicyFixedHeight.calculateScale.height");
    if (orientation === UIOrientation.HORIZONTAL) {
      return this.fixedHeightLandscapeInternal / height;
    }
    if (orientation === UIOrientation.SQUARE && this.fixedHeightSquareInternal !== null) {
      return this.fixedHeightSquareInternal / height;
    }
    return this.fixedHeightPortraitInternal / height;
  }
}

import type { UILayerOrientation } from "../../layers/UILayer/UILayer.Internal.js";
import { assertValidPositiveNumber } from "../asserts.js";
import { UIOrientation } from "../UIOrientation.js";
import { UIResizePolicy } from "./UIResizePolicy.js";

/** Scales by width with orientation-specific targets */
export class UIResizePolicyFixedWidth extends UIResizePolicy {
  private fixedWidthLandscapeInternal: number;
  private fixedWidthPortraitInternal: number;
  private fixedWidthSquareInternal: number | null;

  /**
   * Creates fixed width resize policy.
   *
   * @param fixedWidthLandscape - Target width when landscape
   * @param fixedWidthPortrait - Target width when portrait
   * @param fixedWidthSquare - Target width when square. The portrait rule applies if omitted
   */
  constructor(fixedWidthLandscape: number, fixedWidthPortrait: number, fixedWidthSquare?: number) {
    super();
    assertValidPositiveNumber(
      fixedWidthLandscape,
      "UIResizePolicyFixedWidth.constructor.fixedWidthLandscape",
    );
    assertValidPositiveNumber(
      fixedWidthPortrait,
      "UIResizePolicyFixedWidth.constructor.fixedWidthPortrait",
    );
    if (fixedWidthSquare !== undefined) {
      assertValidPositiveNumber(
        fixedWidthSquare,
        "UIResizePolicyFixedWidth.constructor.fixedWidthSquare",
      );
    }

    this.fixedWidthLandscapeInternal = fixedWidthLandscape;
    this.fixedWidthPortraitInternal = fixedWidthPortrait;
    this.fixedWidthSquareInternal = fixedWidthSquare ?? null;
  }

  /** Target width when landscape */
  public get fixedWidthLandscape(): number {
    return this.fixedWidthLandscapeInternal;
  }

  /** Target width when portrait */
  public get fixedWidthPortrait(): number {
    return this.fixedWidthPortraitInternal;
  }

  /** Target width when square; null for the portrait rule */
  public get fixedWidthSquare(): number | null {
    return this.fixedWidthSquareInternal;
  }

  /** Target width when landscape */
  public set fixedWidthLandscape(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyFixedWidth.fixedWidthLandscape");
    if (value !== this.fixedWidthLandscapeInternal) {
      this.fixedWidthLandscapeInternal = value;
      this.markChanged();
    }
  }

  /** Target width when portrait */
  public set fixedWidthPortrait(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyFixedWidth.fixedWidthPortrait");
    if (value !== this.fixedWidthPortraitInternal) {
      this.fixedWidthPortraitInternal = value;
      this.markChanged();
    }
  }

  /** Target width when square; null for the portrait rule */
  public set fixedWidthSquare(value: number | null) {
    if (value !== null) {
      assertValidPositiveNumber(value, "UIResizePolicyFixedWidth.fixedWidthSquare");
    }
    if (value !== this.fixedWidthSquareInternal) {
      this.fixedWidthSquareInternal = value;
      this.markChanged();
    }
  }

  public calculateScale(width: number, height: number, orientation: UILayerOrientation): number {
    assertValidPositiveNumber(width, "UIResizePolicyFixedWidth.calculateScale.width");
    assertValidPositiveNumber(height, "UIResizePolicyFixedWidth.calculateScale.height");
    if (orientation === UIOrientation.HORIZONTAL) {
      return this.fixedWidthLandscapeInternal / width;
    }
    if (orientation === UIOrientation.SQUARE && this.fixedWidthSquareInternal !== null) {
      return this.fixedWidthSquareInternal / width;
    }
    return this.fixedWidthPortraitInternal / width;
  }
}

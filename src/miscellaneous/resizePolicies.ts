import { assertValidPositiveNumber } from "./asserts";

/**
 * Base class for UI resize policies.
 *
 * Calculates scale factors based on viewport dimensions. Different policies
 * implement different scaling strategies.
 */
export abstract class UIResizePolicy {
  /**
   * Calculates scale factor for given dimensions.
   *
   * @param width - Viewport width in pixels
   * @param height - Viewport height in pixels
   * @returns Scale factor to apply
   * @protected
   */
  public abstract calculateScaleInternal(width: number, height: number): number;
}

/**
 * No scaling applied, always returns 1:1 scale.
 */
export class UIResizePolicyNone extends UIResizePolicy {
  public calculateScaleInternal(width: number, height: number): number {
    void width;
    void height;
    return 1;
  }
}

/**
 * Maintains fixed width, scales based on window width.
 *
 * Uses different widths for landscape vs portrait orientation.
 */
export class UIResizePolicyFixedWidth extends UIResizePolicy {
  /**
   * @param fixedWidthLandscape - Target width for landscape (width > height)
   * @param fixedWidthPortrait - Target width for portrait (width <= height)
   */
  constructor(
    public fixedWidthLandscape: number,
    public fixedWidthPortrait: number,
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
  }

  public calculateScaleInternal(width: number, height: number): number {
    return width > height
      ? this.fixedWidthLandscape / width
      : this.fixedWidthPortrait / width;
  }
}

/**
 * Maintains fixed height, scales based on window height.
 *
 * Uses different heights for landscape vs portrait orientation.
 */
export class UIResizePolicyFixedHeight extends UIResizePolicy {
  /**
   * @param fixedHeightLandscape - Target height for landscape (width > height)
   * @param fixedHeightPortrait - Target height for portrait (width <= height)
   */
  constructor(
    public fixedHeightLandscape: number,
    public fixedHeightPortrait: number,
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
  }

  public calculateScaleInternal(width: number, height: number): number {
    return width > height
      ? this.fixedHeightLandscape / height
      : this.fixedHeightPortrait / height;
  }
}

/**
 * Scales by width in landscape, by height in portrait.
 */
export class UIResizePolicyCross extends UIResizePolicy {
  /**
   * @param fixedWidthLandscape - Target width for landscape
   * @param fixedHeightPortrait - Target height for portrait
   */
  constructor(
    public fixedWidthLandscape: number,
    public fixedHeightPortrait: number,
  ) {
    super();
    assertValidPositiveNumber(
      fixedWidthLandscape,
      "UIResizePolicyCross.fixedWidthLandscape",
    );
    assertValidPositiveNumber(
      fixedHeightPortrait,
      "UIResizePolicyCross.fixedHeightPortrait",
    );
  }

  public calculateScaleInternal(width: number, height: number): number {
    return width > height
      ? this.fixedWidthLandscape / width
      : this.fixedHeightPortrait / height;
  }
}

/**
 * Scales by height in landscape, by width in portrait.
 */
export class UIResizePolicyCrossInverted extends UIResizePolicy {
  /**
   * @param fixedHeightLandscape - Target height for landscape
   * @param fixedWidthPortrait - Target width for portrait
   */
  constructor(
    public fixedHeightLandscape: number,
    public fixedWidthPortrait: number,
  ) {
    super();
    assertValidPositiveNumber(
      fixedHeightLandscape,
      "UIResizePolicyCrossInverted.fixedHeightLandscape",
    );
    assertValidPositiveNumber(
      fixedWidthPortrait,
      "UIResizePolicyCrossInverted.fixedWidthPortrait",
    );
  }

  public calculateScaleInternal(width: number, height: number): number {
    return width > height
      ? this.fixedHeightLandscape / height
      : this.fixedWidthPortrait / width;
  }
}

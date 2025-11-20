import { Eventail } from "eventail";
import { assertValidPositiveNumber } from "./asserts";

export enum UIResizePolicyEvent {
  CHANGE = 0,
}

/**
 * Base class for UI resize policies.
 *
 * Calculates scale factors based on viewport dimensions. Different policies
 * implement different scaling strategies.
 */
export abstract class UIResizePolicy extends Eventail {
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
  private fixedWidthLandscapeInternal: number;
  private fixedWidthPortraitInternal: number;

  /**
   * @param fixedWidthLandscape - Target width for landscape (width > height)
   * @param fixedWidthPortrait - Target width for portrait (width <= height)
   */
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

  public get fixedWidthLandscape(): number {
    return this.fixedWidthLandscapeInternal;
  }

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

  public calculateScaleInternal(width: number, height: number): number {
    return width > height
      ? this.fixedWidthLandscapeInternal / width
      : this.fixedWidthPortraitInternal / width;
  }
}

/**
 * Maintains fixed height, scales based on window height.
 *
 * Uses different heights for landscape vs portrait orientation.
 */
export class UIResizePolicyFixedHeight extends UIResizePolicy {
  private fixedHeightLandscapeInternal: number;
  private fixedHeightPortraitInternal: number;

  /**
   * @param fixedHeightLandscape - Target height for landscape (width > height)
   * @param fixedHeightPortrait - Target height for portrait (width <= height)
   */
  constructor(fixedHeightLandscape: number, fixedHeightPortrait: number) {
    super();
    assertValidPositiveNumber(
      fixedHeightLandscape,
      "UIResizePolicyFixedHeight.fixedHeightLandscape",
    );
    assertValidPositiveNumber(
      fixedHeightPortrait,
      "UIResizePolicyFixedHeight.fixedHeightPortrait",
    );
    this.fixedHeightLandscapeInternal = fixedHeightLandscape;
    this.fixedHeightPortraitInternal = fixedHeightPortrait;
  }

  public get fixedHeightLandscape(): number {
    return this.fixedHeightLandscapeInternal;
  }

  public get fixedHeightPortrait(): number {
    return this.fixedHeightPortraitInternal;
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

  public calculateScaleInternal(width: number, height: number): number {
    return width > height
      ? this.fixedHeightLandscapeInternal / height
      : this.fixedHeightPortraitInternal / height;
  }
}

/**
 * Scales by width in landscape, by height in portrait.
 */
export class UIResizePolicyCross extends UIResizePolicy {
  private fixedWidthLandscapeInternal: number;
  private fixedHeightPortraitInternal: number;

  /**
   * @param fixedWidthLandscape - Target width for landscape
   * @param fixedHeightPortrait - Target height for portrait
   */
  constructor(fixedWidthLandscape: number, fixedHeightPortrait: number) {
    super();
    assertValidPositiveNumber(
      fixedWidthLandscape,
      "UIResizePolicyCross.fixedWidthLandscape",
    );
    assertValidPositiveNumber(
      fixedHeightPortrait,
      "UIResizePolicyCross.fixedHeightPortrait",
    );
    this.fixedWidthLandscapeInternal = fixedWidthLandscape;
    this.fixedHeightPortraitInternal = fixedHeightPortrait;
  }

  public get fixedWidthLandscape(): number {
    return this.fixedWidthLandscapeInternal;
  }

  public get fixedHeightPortrait(): number {
    return this.fixedHeightPortraitInternal;
  }

  public set fixedWidthLandscape(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCross.fixedWidthLandscape");
    if (value !== this.fixedWidthLandscapeInternal) {
      this.fixedWidthLandscapeInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public set fixedHeightPortrait(value: number) {
    assertValidPositiveNumber(value, "UIResizePolicyCross.fixedHeightPortrait");
    if (value !== this.fixedHeightPortraitInternal) {
      this.fixedHeightPortraitInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public calculateScaleInternal(width: number, height: number): number {
    return width > height
      ? this.fixedWidthLandscapeInternal / width
      : this.fixedHeightPortraitInternal / height;
  }
}

/**
 * Scales by height in landscape, by width in portrait.
 */
export class UIResizePolicyCrossInverted extends UIResizePolicy {
  private fixedHeightLandscapeInternal: number;
  private fixedWidthPortraitInternal: number;

  /**
   * @param fixedHeightLandscape - Target height for landscape
   * @param fixedWidthPortrait - Target width for portrait
   */
  constructor(fixedHeightLandscape: number, fixedWidthPortrait: number) {
    super();
    assertValidPositiveNumber(
      fixedHeightLandscape,
      "UIResizePolicyCrossInverted.fixedHeightLandscape",
    );
    assertValidPositiveNumber(
      fixedWidthPortrait,
      "UIResizePolicyCrossInverted.fixedWidthPortrait",
    );
    this.fixedHeightLandscapeInternal = fixedHeightLandscape;
    this.fixedWidthPortraitInternal = fixedWidthPortrait;
  }

  public get fixedHeightLandscape(): number {
    return this.fixedHeightLandscapeInternal;
  }

  public get fixedWidthPortrait(): number {
    return this.fixedWidthPortraitInternal;
  }

  public set fixedHeightLandscape(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyCrossInverted.fixedHeightLandscape",
    );
    if (value !== this.fixedHeightLandscapeInternal) {
      this.fixedHeightLandscapeInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public set fixedWidthPortrait(value: number) {
    assertValidPositiveNumber(
      value,
      "UIResizePolicyCrossInverted.fixedWidthPortrait",
    );
    if (value !== this.fixedWidthPortraitInternal) {
      this.fixedWidthPortraitInternal = value;
      this.emit(UIResizePolicyEvent.CHANGE);
    }
  }

  public calculateScaleInternal(width: number, height: number): number {
    return width > height
      ? this.fixedHeightLandscapeInternal / height
      : this.fixedWidthPortraitInternal / width;
  }
}

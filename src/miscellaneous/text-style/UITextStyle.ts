import {
  assertValidNonNegativeNumber,
  assertValidNumber,
  assertValidPositiveNumber,
} from "../asserts";
import {
  TEXT_STYLE_DEFAULT_ALIGN,
  TEXT_STYLE_DEFAULT_COLOR,
  TEXT_STYLE_DEFAULT_ENABLE_SHADOW,
  TEXT_STYLE_DEFAULT_ENABLE_STROKE,
  TEXT_STYLE_DEFAULT_FONT_FAMILY,
  TEXT_STYLE_DEFAULT_FONT_SIZE,
  TEXT_STYLE_DEFAULT_FONT_STYLE,
  TEXT_STYLE_DEFAULT_FONT_WEIGHT,
  TEXT_STYLE_DEFAULT_LINE_HEIGHT,
  TEXT_STYLE_DEFAULT_SHADOW_BLUR,
  TEXT_STYLE_DEFAULT_SHADOW_COLOR,
  TEXT_STYLE_DEFAULT_SHADOW_OFFSET_X,
  TEXT_STYLE_DEFAULT_SHADOW_OFFSET_Y,
  TEXT_STYLE_DEFAULT_STROKE_COLOR,
  TEXT_STYLE_DEFAULT_STROKE_THICKNESS,
  type UITextStyleConfig,
} from "./UITextStyle.Internal";

/**
 * Text style configuration for UI text rendering.
 * Manages font properties, colors, shadows, and strokes.
 */
export class UITextStyle {
  private colorInternal?: string;
  private alignInternal?: "left" | "center" | "right";
  private fontFamilyInternal?: string;
  private fontSizeInternal?: number;
  private fontStyleInternal?: "normal" | "italic" | "oblique";
  private fontWeightInternal?:
    | "normal"
    | "bold"
    | "bolder"
    | "lighter"
    | number;
  private lineHeightInternal?: number;
  private enableShadowInternal?: boolean;
  private shadowOffsetXInternal?: number;
  private shadowOffsetYInternal?: number;
  private shadowBlurInternal?: number;
  private shadowColorInternal?: string;
  private enableStrokeInternal?: boolean;
  private strokeColorInternal?: string;
  private strokeThicknessInternal?: number;

  private dirtyInternal = true;

  constructor(config?: Partial<UITextStyleConfig>) {
    this.colorInternal = config?.color;
    this.alignInternal = config?.align;
    this.fontFamilyInternal = config?.fontFamily;
    this.fontSizeInternal = config?.fontSize;
    this.fontStyleInternal = config?.fontStyle;
    this.fontWeightInternal = config?.fontWeight;
    this.lineHeightInternal = config?.lineHeight;
    this.enableShadowInternal = config?.enableShadow;
    this.shadowOffsetXInternal = config?.shadowOffsetX;
    this.shadowOffsetYInternal = config?.shadowOffsetY;
    this.shadowBlurInternal = config?.shadowBlur;
    this.shadowColorInternal = config?.shadowColor;
    this.enableStrokeInternal = config?.enableStroke;
    this.strokeColorInternal = config?.strokeColor;
    this.strokeThicknessInternal = config?.strokeThickness;
  }

  /** Text color. */
  public get color(): string | undefined {
    return this.colorInternal;
  }

  /** Text alignment. */
  public get align(): "left" | "center" | "right" | undefined {
    return this.alignInternal;
  }

  /** Font family name. */
  public get fontFamily(): string | undefined {
    return this.fontFamilyInternal;
  }

  /** Font size in pixels. */
  public get fontSize(): number | undefined {
    return this.fontSizeInternal;
  }

  /** Font style. */
  public get fontStyle(): "normal" | "italic" | "oblique" | undefined {
    return this.fontStyleInternal;
  }

  /** Font weight. */
  public get fontWeight():
    | "normal"
    | "bold"
    | "bolder"
    | "lighter"
    | number
    | undefined {
    return this.fontWeightInternal;
  }

  /** Line height in pixels. */
  public get lineHeight(): number | undefined {
    return this.lineHeightInternal;
  }

  /** Whether shadow is enabled. */
  public get enableShadow(): boolean | undefined {
    return this.enableShadowInternal;
  }

  /** Shadow horizontal offset in pixels. */
  public get shadowOffsetX(): number | undefined {
    return this.shadowOffsetXInternal;
  }

  /** Shadow vertical offset in pixels. */
  public get shadowOffsetY(): number | undefined {
    return this.shadowOffsetYInternal;
  }

  /** Shadow blur radius in pixels. */
  public get shadowBlur(): number | undefined {
    return this.shadowBlurInternal;
  }

  /** Shadow color. */
  public get shadowColor(): string | undefined {
    return this.shadowColorInternal;
  }

  /** Whether stroke is enabled. */
  public get enableStroke(): boolean | undefined {
    return this.enableStrokeInternal;
  }

  /** Stroke color. */
  public get strokeColor(): string | undefined {
    return this.strokeColorInternal;
  }

  /** Stroke thickness in pixels. */
  public get strokeThickness(): number | undefined {
    return this.strokeThicknessInternal;
  }

  /**
   * Indicates whether any property has been modified.
   * Must be reset to `false` externally by the owner.
   * @internal
   */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  public set color(value: string | undefined) {
    if (value !== this.colorInternal) {
      this.colorInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set align(value: "left" | "center" | "right" | undefined) {
    if (value !== this.alignInternal) {
      this.alignInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set fontFamily(value: string | undefined) {
    if (value !== this.fontFamilyInternal) {
      this.fontFamilyInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set fontSize(value: number | undefined) {
    if (value !== undefined) {
      assertValidPositiveNumber(value, "UITextStyle.fontSize");
    }
    if (value !== this.fontSizeInternal) {
      this.fontSizeInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set fontStyle(value: "normal" | "italic" | "oblique" | undefined) {
    if (value !== this.fontStyleInternal) {
      this.fontStyleInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set fontWeight(
    value: "normal" | "bold" | "bolder" | "lighter" | number | undefined,
  ) {
    if (typeof value === "number") {
      assertValidPositiveNumber(value, "UITextStyle.fontWeight");
    }
    if (value !== this.fontWeightInternal) {
      this.fontWeightInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set lineHeight(value: number | undefined) {
    if (value !== undefined) {
      assertValidNumber(value, "UITextStyle.lineHeight");
    }
    if (value !== this.lineHeightInternal) {
      this.lineHeightInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set enableShadow(value: boolean | undefined) {
    if (value !== this.enableShadowInternal) {
      this.enableShadowInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set shadowOffsetX(value: number | undefined) {
    if (value !== undefined) {
      assertValidNonNegativeNumber(value, "UITextStyle.shadowOffsetX");
    }
    if (value !== this.shadowOffsetXInternal) {
      this.shadowOffsetXInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set shadowOffsetY(value: number | undefined) {
    if (value !== undefined) {
      assertValidNonNegativeNumber(value, "UITextStyle.shadowOffsetY");
    }
    if (value !== this.shadowOffsetYInternal) {
      this.shadowOffsetYInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set shadowBlur(value: number | undefined) {
    if (value !== undefined) {
      assertValidNonNegativeNumber(value, "UITextStyle.shadowBlur");
    }
    if (value !== this.shadowBlurInternal) {
      this.shadowBlurInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set shadowColor(value: string | undefined) {
    if (value !== this.shadowColorInternal) {
      this.shadowColorInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set enableStroke(value: boolean | undefined) {
    if (value !== this.enableStrokeInternal) {
      this.enableStrokeInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set strokeColor(value: string | undefined) {
    if (value !== this.strokeColorInternal) {
      this.strokeColorInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set strokeThickness(value: number | undefined) {
    if (value !== undefined) {
      assertValidNonNegativeNumber(value, "UITextStyle.strokeThickness");
    }
    if (value !== this.strokeThicknessInternal) {
      this.strokeThicknessInternal = value;
      this.dirtyInternal = true;
    }
  }

  public static resolve(
    primary?: UITextStyle,
    fallback?: UITextStyle,
  ): UITextStyleConfig {
    const fontSize =
      primary?.fontSizeInternal ??
      fallback?.fontSizeInternal ??
      TEXT_STYLE_DEFAULT_FONT_SIZE;

    return {
      color:
        primary?.colorInternal ??
        fallback?.colorInternal ??
        TEXT_STYLE_DEFAULT_COLOR,
      align:
        primary?.alignInternal ??
        fallback?.alignInternal ??
        TEXT_STYLE_DEFAULT_ALIGN,
      fontFamily:
        primary?.fontFamilyInternal ??
        fallback?.fontFamilyInternal ??
        TEXT_STYLE_DEFAULT_FONT_FAMILY,
      fontSize,
      fontStyle:
        primary?.fontStyleInternal ??
        fallback?.fontStyleInternal ??
        TEXT_STYLE_DEFAULT_FONT_STYLE,
      fontWeight:
        primary?.fontWeightInternal ??
        fallback?.fontWeightInternal ??
        TEXT_STYLE_DEFAULT_FONT_WEIGHT,
      lineHeight:
        primary?.lineHeightInternal ??
        fallback?.lineHeightInternal ??
        fontSize * TEXT_STYLE_DEFAULT_LINE_HEIGHT,
      enableShadow:
        primary?.enableShadowInternal ??
        fallback?.enableShadowInternal ??
        TEXT_STYLE_DEFAULT_ENABLE_SHADOW,
      shadowOffsetX:
        primary?.shadowOffsetXInternal ??
        fallback?.shadowOffsetXInternal ??
        TEXT_STYLE_DEFAULT_SHADOW_OFFSET_X,
      shadowOffsetY:
        primary?.shadowOffsetYInternal ??
        fallback?.shadowOffsetYInternal ??
        TEXT_STYLE_DEFAULT_SHADOW_OFFSET_Y,
      shadowBlur:
        primary?.shadowBlurInternal ??
        fallback?.shadowBlurInternal ??
        TEXT_STYLE_DEFAULT_SHADOW_BLUR,
      shadowColor:
        primary?.shadowColorInternal ??
        fallback?.shadowColorInternal ??
        TEXT_STYLE_DEFAULT_SHADOW_COLOR,
      enableStroke:
        primary?.enableStrokeInternal ??
        fallback?.enableStrokeInternal ??
        TEXT_STYLE_DEFAULT_ENABLE_STROKE,
      strokeColor:
        primary?.strokeColorInternal ??
        fallback?.strokeColorInternal ??
        TEXT_STYLE_DEFAULT_STROKE_COLOR,
      strokeThickness:
        primary?.strokeThicknessInternal ??
        fallback?.strokeThicknessInternal ??
        TEXT_STYLE_DEFAULT_STROKE_THICKNESS,
    };
  }

  /** @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
  }

  /** Sets all properties to default values. */
  public setDefaults(): void {
    if (
      this.colorInternal !== TEXT_STYLE_DEFAULT_COLOR ||
      this.alignInternal !== TEXT_STYLE_DEFAULT_ALIGN ||
      this.fontFamilyInternal !== TEXT_STYLE_DEFAULT_FONT_FAMILY ||
      this.fontSizeInternal !== TEXT_STYLE_DEFAULT_FONT_SIZE ||
      this.fontStyleInternal !== TEXT_STYLE_DEFAULT_FONT_STYLE ||
      this.fontWeightInternal !== TEXT_STYLE_DEFAULT_FONT_WEIGHT ||
      this.lineHeightInternal !==
        TEXT_STYLE_DEFAULT_FONT_SIZE * TEXT_STYLE_DEFAULT_LINE_HEIGHT ||
      this.enableShadowInternal !== TEXT_STYLE_DEFAULT_ENABLE_SHADOW ||
      this.shadowOffsetXInternal !== TEXT_STYLE_DEFAULT_SHADOW_OFFSET_X ||
      this.shadowOffsetYInternal !== TEXT_STYLE_DEFAULT_SHADOW_OFFSET_Y ||
      this.shadowBlurInternal !== TEXT_STYLE_DEFAULT_SHADOW_BLUR ||
      this.shadowColorInternal !== TEXT_STYLE_DEFAULT_SHADOW_COLOR ||
      this.enableStrokeInternal !== TEXT_STYLE_DEFAULT_ENABLE_STROKE ||
      this.strokeColorInternal !== TEXT_STYLE_DEFAULT_STROKE_COLOR ||
      this.strokeThicknessInternal !== TEXT_STYLE_DEFAULT_STROKE_THICKNESS
    ) {
      this.colorInternal = TEXT_STYLE_DEFAULT_COLOR;
      this.alignInternal = TEXT_STYLE_DEFAULT_ALIGN;
      this.fontFamilyInternal = TEXT_STYLE_DEFAULT_FONT_FAMILY;
      this.fontSizeInternal = TEXT_STYLE_DEFAULT_FONT_SIZE;
      this.fontStyleInternal = TEXT_STYLE_DEFAULT_FONT_STYLE;
      this.fontWeightInternal = TEXT_STYLE_DEFAULT_FONT_WEIGHT;
      this.lineHeightInternal =
        TEXT_STYLE_DEFAULT_FONT_SIZE * TEXT_STYLE_DEFAULT_LINE_HEIGHT;
      this.enableShadowInternal = TEXT_STYLE_DEFAULT_ENABLE_SHADOW;
      this.shadowOffsetXInternal = TEXT_STYLE_DEFAULT_SHADOW_OFFSET_X;
      this.shadowOffsetYInternal = TEXT_STYLE_DEFAULT_SHADOW_OFFSET_Y;
      this.shadowBlurInternal = TEXT_STYLE_DEFAULT_SHADOW_BLUR;
      this.shadowColorInternal = TEXT_STYLE_DEFAULT_SHADOW_COLOR;
      this.enableStrokeInternal = TEXT_STYLE_DEFAULT_ENABLE_STROKE;
      this.strokeColorInternal = TEXT_STYLE_DEFAULT_STROKE_COLOR;
      this.strokeThicknessInternal = TEXT_STYLE_DEFAULT_STROKE_THICKNESS;
      this.dirtyInternal = true;
    }
  }

  /** Clears all properties (sets them to undefined). */
  public clear(): void {
    if (
      this.colorInternal !== undefined ||
      this.alignInternal !== undefined ||
      this.fontFamilyInternal !== undefined ||
      this.fontSizeInternal !== undefined ||
      this.fontStyleInternal !== undefined ||
      this.fontWeightInternal !== undefined ||
      this.lineHeightInternal !== undefined ||
      this.enableShadowInternal !== undefined ||
      this.shadowOffsetXInternal !== undefined ||
      this.shadowOffsetYInternal !== undefined ||
      this.shadowBlurInternal !== undefined ||
      this.shadowColorInternal !== undefined ||
      this.enableStrokeInternal !== undefined ||
      this.strokeColorInternal !== undefined ||
      this.strokeThicknessInternal !== undefined
    ) {
      this.colorInternal = undefined;
      this.alignInternal = undefined;
      this.fontFamilyInternal = undefined;
      this.fontSizeInternal = undefined;
      this.fontStyleInternal = undefined;
      this.fontWeightInternal = undefined;
      this.lineHeightInternal = undefined;
      this.enableShadowInternal = undefined;
      this.shadowOffsetXInternal = undefined;
      this.shadowOffsetYInternal = undefined;
      this.shadowBlurInternal = undefined;
      this.shadowColorInternal = undefined;
      this.enableStrokeInternal = undefined;
      this.strokeColorInternal = undefined;
      this.strokeThicknessInternal = undefined;
      this.dirtyInternal = true;
    }
  }

  /** Copies properties from another UITextStyle. */
  public copy(value: UITextStyle): void {
    if (
      this.colorInternal !== value.colorInternal ||
      this.alignInternal !== value.alignInternal ||
      this.fontFamilyInternal !== value.fontFamilyInternal ||
      this.fontSizeInternal !== value.fontSizeInternal ||
      this.fontStyleInternal !== value.fontStyleInternal ||
      this.fontWeightInternal !== value.fontWeightInternal ||
      this.lineHeightInternal !== value.lineHeightInternal ||
      this.enableShadowInternal !== value.enableShadowInternal ||
      this.shadowOffsetXInternal !== value.shadowOffsetXInternal ||
      this.shadowOffsetYInternal !== value.shadowOffsetYInternal ||
      this.shadowBlurInternal !== value.shadowBlurInternal ||
      this.shadowColorInternal !== value.shadowColorInternal ||
      this.enableStrokeInternal !== value.enableStrokeInternal ||
      this.strokeColorInternal !== value.strokeColorInternal ||
      this.strokeThicknessInternal !== value.strokeThicknessInternal
    ) {
      this.colorInternal = value.colorInternal;
      this.alignInternal = value.alignInternal;
      this.fontFamilyInternal = value.fontFamilyInternal;
      this.fontSizeInternal = value.fontSizeInternal;
      this.fontStyleInternal = value.fontStyleInternal;
      this.fontWeightInternal = value.fontWeightInternal;
      this.lineHeightInternal = value.lineHeightInternal;
      this.enableShadowInternal = value.enableShadowInternal;
      this.shadowOffsetXInternal = value.shadowOffsetXInternal;
      this.shadowOffsetYInternal = value.shadowOffsetYInternal;
      this.shadowBlurInternal = value.shadowBlurInternal;
      this.shadowColorInternal = value.shadowColorInternal;
      this.enableStrokeInternal = value.enableStrokeInternal;
      this.strokeColorInternal = value.strokeColorInternal;
      this.strokeThicknessInternal = value.strokeThicknessInternal;
      this.dirtyInternal = true;
    }
  }

  /**
   * Calculates the maximum padding required for rendering this style.
   * Accounts for stroke and shadow effects without creating a rendering context.
   *
   * @returns Maximum padding in pixels needed on all sides
   */
  public calculatePadding(): number {
    let padding = 0;

    if (this.enableStrokeInternal !== undefined) {
      padding += this.strokeThicknessInternal ?? 0;
    }

    if (this.enableShadowInternal !== undefined) {
      const blur = this.shadowBlurInternal ?? 0;
      const offsetX = this.shadowOffsetXInternal ?? 0;
      const offsetY = this.shadowOffsetYInternal ?? 0;
      const shadowSpread = blur * 2;
      const shadowMaxX = Math.abs(offsetX) + shadowSpread;
      const shadowMaxY = Math.abs(offsetY) + shadowSpread;
      padding += Math.max(shadowMaxX, shadowMaxY);
    }

    return Math.ceil(padding);
  }
}

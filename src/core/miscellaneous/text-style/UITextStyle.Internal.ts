import type { UIColorConfig } from "../color/UIColor.Internal.js";
import type { UILineJoin, UIPaint, UIPaintConfig } from "../paint/UIPaint.Internal.js";

/** Text alignment. `start` and `end` are resolved against the text direction. */
export type UITextAlign = "start" | "left" | "center" | "right" | "end";

/** Font style */
export type UITextFontStyle = "normal" | "italic" | "oblique";

/** Font weight */
export type UITextFontWeight = "normal" | "bold" | "bolder" | "lighter" | number;

/** Box a gradient of the fill or of a stroke is laid over */
export enum UITextPaintBox {
  /** Each line, as high as its line box (see `UIText.lineBox`) */
  LINE = 0,
  /** The whole text without its padding */
  TEXT = 1,
}

/** Outline around the glyphs */
export interface UITextStrokeConfig {
  /** Color or gradient of the outline */
  paint: UIPaintConfig;
  /** Width of the outline outside the glyphs, or outside the previous outline, in pixels */
  thickness: number;
  /** How the corners are joined. Round by default. */
  join?: UILineJoin;
}

/** Outline around the glyphs, as stored by a style */
export interface UITextStroke {
  /** Color or gradient of the outline */
  readonly paint: UIPaint;
  /** Width of the outline outside the glyphs, or outside the previous outline, in pixels */
  readonly thickness: number;
  /** How the corners are joined */
  readonly join: UILineJoin;
}

/**
 * Shadow cast by the glyphs together with their outlines. A shadow without an offset and with a
 * blur is a glow.
 */
export interface UITextShadowConfig {
  /** Shadow color. A string is a `UIColor` name or a CSS color. */
  color: UIColorConfig;
  /** Horizontal offset in pixels, 0 by default */
  offsetX?: number;
  /** Vertical offset in pixels, down is positive, 0 by default */
  offsetY?: number;
  /** Blur radius in pixels, 0 by default */
  blur?: number;
}

/** Shadow, as stored by a style */
export interface UITextShadow {
  /** Shadow color as a CSS color */
  readonly color: string;
  /** Horizontal offset in pixels */
  readonly offsetX: number;
  /** Vertical offset in pixels, down is positive */
  readonly offsetY: number;
  /** Blur radius in pixels */
  readonly blur: number;
}

/** Text style configuration */
export interface UITextStyleConfig {
  /** Color or gradient of the glyphs. A string is a `UIColor` name or a CSS color. */
  color: UIPaintConfig;
  /** Box the gradients of the fill and of the strokes are laid over */
  paintBox: UITextPaintBox;
  /** Text alignment */
  align: UITextAlign;

  /** Font family name */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font style */
  fontStyle: UITextFontStyle;
  /** Font weight */
  fontWeight: UITextFontWeight;
  /**
   * Line height in pixels, the distance between baselines, not a multiple of the font size.
   * Defaults to 1.2 times the font size.
   */
  lineHeight: number;

  /**
   * Outlines from the innermost to the outermost. Each one lies outside the previous one, so the
   * text is as wide as the sum of their thicknesses on each side.
   */
  strokes: readonly UITextStrokeConfig[];
  /** Shadows and glows, the first one on top */
  shadows: readonly UITextShadowConfig[];
}

/** Text style with every property resolved, as the text is measured and drawn with */
export interface UIResolvedTextStyle {
  color: UIPaint;
  paintBox: UITextPaintBox;
  align: UITextAlign;
  fontFamily: string;
  fontSize: number;
  fontStyle: UITextFontStyle;
  fontWeight: UITextFontWeight;
  lineHeight: number;
  strokes: readonly UITextStroke[];
  shadows: readonly UITextShadow[];
}

export const TEXT_STYLE_DEFAULT_COLOR = "#000000";
export const TEXT_STYLE_DEFAULT_PAINT_BOX = UITextPaintBox.LINE;
export const TEXT_STYLE_DEFAULT_ALIGN = "start" as const;
export const TEXT_STYLE_DEFAULT_FONT_FAMILY = "Arial";
export const TEXT_STYLE_DEFAULT_FONT_SIZE = 16;
export const TEXT_STYLE_DEFAULT_FONT_STYLE = "normal" as const;
export const TEXT_STYLE_DEFAULT_FONT_WEIGHT = "normal" as const;
export const TEXT_STYLE_DEFAULT_LINE_HEIGHT = 1.2;
export const TEXT_STYLE_DEFAULT_STROKES: readonly UITextStroke[] = Object.freeze([]);
export const TEXT_STYLE_DEFAULT_SHADOWS: readonly UITextShadow[] = Object.freeze([]);
export const TEXT_STYLE_DEFAULT_STROKE_JOIN = "round" as const;

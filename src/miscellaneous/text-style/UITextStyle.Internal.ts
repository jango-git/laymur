/** Complete text style configuration with all properties resolved */
export interface UITextStyleConfig {
  /** Text color */
  color: string;
  /** Text alignment */
  align: "left" | "center" | "right";

  /** Font family name */
  fontFamily: string;
  /** Font size in pixels */
  fontSize: number;
  /** Font style */
  fontStyle: "normal" | "italic" | "oblique";
  /** Font weight */
  fontWeight: "normal" | "bold" | "bolder" | "lighter" | number;
  /** Line height in pixels */
  lineHeight: number;

  /** Whether shadow is enabled */
  enableShadow: boolean;
  /** Shadow horizontal offset in pixels */
  shadowOffsetX: number;
  /** Shadow vertical offset in pixels */
  shadowOffsetY: number;
  /** Shadow blur radius in pixels */
  shadowBlur: number;
  /** Shadow color */
  shadowColor: string;

  /** Whether stroke is enabled */
  enableStroke: boolean;
  /** Stroke color */
  strokeColor: string;
  /** Stroke thickness in pixels */
  strokeThickness: number;
}

export const TEXT_STYLE_DEFAULT_COLOR = "#000000";
export const TEXT_STYLE_DEFAULT_ALIGN = "left" as const;
export const TEXT_STYLE_DEFAULT_FONT_FAMILY = "Arial";
export const TEXT_STYLE_DEFAULT_FONT_SIZE = 16;
export const TEXT_STYLE_DEFAULT_FONT_STYLE = "normal" as const;
export const TEXT_STYLE_DEFAULT_FONT_WEIGHT = "normal" as const;
export const TEXT_STYLE_DEFAULT_LINE_HEIGHT = 1.2;
export const TEXT_STYLE_DEFAULT_ENABLE_SHADOW = false;
export const TEXT_STYLE_DEFAULT_SHADOW_OFFSET_X = 0;
export const TEXT_STYLE_DEFAULT_SHADOW_OFFSET_Y = 0;
export const TEXT_STYLE_DEFAULT_SHADOW_BLUR = 0;
export const TEXT_STYLE_DEFAULT_SHADOW_COLOR = "transparent";
export const TEXT_STYLE_DEFAULT_ENABLE_STROKE = false;
export const TEXT_STYLE_DEFAULT_STROKE_COLOR = "#000000";
export const TEXT_STYLE_DEFAULT_STROKE_THICKNESS = 0;

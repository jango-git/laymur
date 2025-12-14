export interface UITextStyleConfig {
  color: string;
  align: "left" | "center" | "right";

  fontFamily: string;
  fontSize: number;
  fontStyle: "normal" | "italic" | "oblique";
  fontWeight: "normal" | "bold" | "bolder" | "lighter" | number;
  lineHeight: number;

  enableShadow: boolean;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowColor: string;

  enableStroke: boolean;
  strokeColor: string;
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

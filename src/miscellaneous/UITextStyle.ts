import {
  assertValidNonNegativeNumber,
  assertValidNumber,
  assertValidPositiveNumber,
} from "./asserts";

export interface UITextStyle {
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
  strokeWidth: number;
}

export function isUITextStyle(obj: unknown): obj is UITextStyle {
  if (typeof obj !== "object" || obj === null) {
    return false;
  }

  const candidate = obj as Record<string, unknown>;

  return (
    typeof candidate.color === "string" &&
    (candidate.align === "left" ||
      candidate.align === "center" ||
      candidate.align === "right") &&
    typeof candidate.fontFamily === "string" &&
    typeof candidate.fontSize === "number" &&
    (candidate.fontStyle === "normal" ||
      candidate.fontStyle === "italic" ||
      candidate.fontStyle === "oblique") &&
    (candidate.fontWeight === "normal" ||
      candidate.fontWeight === "bold" ||
      candidate.fontWeight === "bolder" ||
      candidate.fontWeight === "lighter" ||
      typeof candidate.fontWeight === "number") &&
    typeof candidate.lineHeight === "number" &&
    typeof candidate.enableShadow === "boolean" &&
    typeof candidate.shadowOffsetX === "number" &&
    typeof candidate.shadowOffsetY === "number" &&
    typeof candidate.shadowBlur === "number" &&
    typeof candidate.shadowColor === "string" &&
    typeof candidate.enableStroke === "boolean" &&
    typeof candidate.strokeColor === "string" &&
    typeof candidate.strokeWidth === "number"
  );
}

export const DEFAULT_TEXT_STYLE: UITextStyle = {
  color: "#000000",
  align: "left",

  fontFamily: "Arial",
  fontSize: 16,
  fontStyle: "normal",
  fontWeight: "normal",
  lineHeight: 1.2,

  enableShadow: false,
  shadowOffsetX: 0,
  shadowOffsetY: 0,
  shadowBlur: 0,
  shadowColor: "transparent",

  enableStroke: false,
  strokeColor: "#000000",
  strokeWidth: 0,
};

export function resolveTextStyle(
  style?: Partial<UITextStyle>,
  commonStyle?: Partial<UITextStyle>,
): UITextStyle {
  const fontSize =
    style?.fontSize ?? commonStyle?.fontSize ?? DEFAULT_TEXT_STYLE.fontSize;
  assertValidPositiveNumber(fontSize, "Font size");

  const fontWeight = style?.fontWeight ?? commonStyle?.fontWeight ?? "normal";
  if (typeof fontWeight === "number") {
    assertValidPositiveNumber(fontWeight, "Font weight");
  }

  const lineHeight =
    style?.lineHeight ??
    commonStyle?.lineHeight ??
    fontSize * DEFAULT_TEXT_STYLE.lineHeight;
  assertValidNumber(lineHeight, "Line height");

  const shadowOffsetX =
    style?.shadowOffsetX ??
    commonStyle?.shadowOffsetX ??
    DEFAULT_TEXT_STYLE.shadowOffsetX;
  assertValidNonNegativeNumber(shadowOffsetX, "Shadow offset X");

  const shadowOffsetY =
    style?.shadowOffsetY ??
    commonStyle?.shadowOffsetY ??
    DEFAULT_TEXT_STYLE.shadowOffsetY;
  assertValidNonNegativeNumber(shadowOffsetY, "Shadow offset Y");

  const shadowBlur =
    style?.shadowBlur ??
    commonStyle?.shadowBlur ??
    DEFAULT_TEXT_STYLE.shadowBlur;
  assertValidNonNegativeNumber(shadowBlur, "Shadow blur");

  const strokeWidth =
    style?.strokeWidth ??
    commonStyle?.strokeWidth ??
    DEFAULT_TEXT_STYLE.strokeWidth;
  assertValidNonNegativeNumber(strokeWidth, "Stroke width");

  return {
    color: style?.color ?? commonStyle?.color ?? DEFAULT_TEXT_STYLE.color,
    align: style?.align ?? commonStyle?.align ?? DEFAULT_TEXT_STYLE.align,

    fontFamily:
      style?.fontFamily ??
      commonStyle?.fontFamily ??
      DEFAULT_TEXT_STYLE.fontFamily,
    fontSize,
    fontStyle:
      style?.fontStyle ??
      commonStyle?.fontStyle ??
      DEFAULT_TEXT_STYLE.fontStyle,
    fontWeight,
    lineHeight,

    enableShadow:
      style?.enableShadow ??
      commonStyle?.enableShadow ??
      DEFAULT_TEXT_STYLE.enableShadow,
    shadowOffsetX,
    shadowOffsetY,
    shadowBlur,
    shadowColor:
      style?.shadowColor ??
      commonStyle?.shadowColor ??
      DEFAULT_TEXT_STYLE.shadowColor,

    enableStroke:
      style?.enableStroke ??
      commonStyle?.enableStroke ??
      DEFAULT_TEXT_STYLE.enableStroke,
    strokeColor:
      style?.strokeColor ??
      commonStyle?.strokeColor ??
      DEFAULT_TEXT_STYLE.strokeColor,
    strokeWidth,
  };
}

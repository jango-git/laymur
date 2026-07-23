import type { UICanvasRenderingContext2D } from "../../miscellaneous/canvas";
import type {
  UITextAlign,
  UITextStyleConfig,
} from "../../miscellaneous/text-style/UITextStyle.Internal";
import { TEXT_STYLE_DEFAULT_ALIGN } from "../../miscellaneous/text-style/UITextStyle.Internal";
import { reorderChunksVisually } from "./UIText.Bidi";
import type { UITextLine } from "./UIText.Interfaces";
import { applyFontStyle } from "./UIText.Measuring";

/**
 * Resolves logical alignment into a physical one.
 * @param align Alignment to resolve
 * @param isRTL Whether the paragraph reads right to left
 * @returns Physical alignment
 */
function resolveAlign(align: UITextAlign, isRTL: boolean): "left" | "center" | "right" {
  if (align === "start") {
    return isRTL ? "right" : "left";
  }

  if (align === "end") {
    return isRTL ? "left" : "right";
  }

  return align;
}

/**
 * Renders single text chunk.
 * @param x X coordinate in pixels
 * @param y Y coordinate in pixels
 * @param text Chunk text
 * @param style Resolved text style
 * @param context Canvas rendering context
 */
export function renderTextChunk(
  x: number,
  y: number,
  text: string,
  style: UITextStyleConfig,
  context: UICanvasRenderingContext2D,
): void {
  applyFontStyle(context, style);

  if (style.enableShadow) {
    context.shadowOffsetX = style.shadowOffsetX;
    context.shadowOffsetY = style.shadowOffsetY;
    context.shadowBlur = style.shadowBlur;
    context.shadowColor = style.shadowColor;
  } else {
    context.shadowColor = "transparent";
  }

  if (style.enableStroke) {
    context.strokeStyle = style.strokeColor;
    context.lineWidth = style.strokeThickness;
    context.strokeText(text, x, y);
  }

  context.fillStyle = style.color;
  context.fillText(text, x, y);
}

/**
 * Renders text lines to canvas.
 * Chunks are laid out left to right after visual reordering, so x stays the left edge.
 * @param paddingTop Top padding in pixels
 * @param paddingLeft Left padding in pixels
 * @param lines Text lines to render
 * @param isRTL Whether the paragraph reads right to left
 * @param context Canvas rendering context
 */
export function renderTextLines(
  paddingTop: number,
  paddingLeft: number,
  lines: UITextLine[],
  isRTL: boolean,
  context: UICanvasRenderingContext2D,
): void {
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.direction = isRTL ? "rtl" : "ltr";
  context.textAlign = "left";

  let currentY = paddingTop;

  let textWidth = 0;
  for (const line of lines) {
    textWidth = Math.max(line.width, textWidth);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const firstAlign = line.chunks[0]?.style.align ?? TEXT_STYLE_DEFAULT_ALIGN;
    const isUniformAlign = line.chunks.every((c) => c.style.align === firstAlign);
    const lineAlign = resolveAlign(isUniformAlign ? firstAlign : TEXT_STYLE_DEFAULT_ALIGN, isRTL);

    let offsetX = 0;

    if (lineAlign === "center") {
      offsetX = (textWidth - line.width) / 2;
    } else if (lineAlign === "right") {
      offsetX = textWidth - line.width;
    }

    let currentX = paddingLeft + offsetX;
    currentY += i === 0 ? line.baseline : line.lineHeight;

    for (const chunk of reorderChunksVisually(line.chunks, isRTL)) {
      renderTextChunk(currentX, currentY, chunk.text, chunk.style, context);
      currentX += chunk.metrics.width;
    }
  }
}

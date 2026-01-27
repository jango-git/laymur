import type { UICanvasRenderingContext2D } from "../../miscellaneous/canvas";
import type { UITextStyleConfig } from "../../miscellaneous/text-style/UITextStyle.Internal";
import { TEXT_STYLE_DEFAULT_ALIGN } from "../../miscellaneous/text-style/UITextStyle.Internal";
import type { UITextLine } from "./UIText.Interfaces";

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
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px "${style.fontFamily}"`;

  if (style.enableShadow) {
    context.shadowOffsetX = style.shadowOffsetX;
    context.shadowOffsetY = style.shadowOffsetY;
    context.shadowBlur = style.shadowBlur;
    context.shadowColor = style.shadowColor;
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
 * @param paddingTop Top padding in pixels
 * @param paddingLeft Left padding in pixels
 * @param lines Text lines to render
 * @param context Canvas rendering context
 */
export function renderTextLines(
  paddingTop: number,
  paddingLeft: number,
  lines: UITextLine[],
  context: UICanvasRenderingContext2D,
): void {
  let currentY = paddingTop;

  let textWidth = 0;
  for (const line of lines) {
    textWidth = Math.max(line.width, textWidth);
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const firstAlign = line.chunks[0]?.style.align ?? TEXT_STYLE_DEFAULT_ALIGN;
    const isUniformAlign = line.chunks.every((c) => c.style.align === firstAlign);
    const lineAlign = isUniformAlign ? firstAlign : TEXT_STYLE_DEFAULT_ALIGN;

    let offsetX = 0;

    if (lineAlign === "center") {
      offsetX = (textWidth - line.width) / 2;
    } else if (lineAlign === "right") {
      offsetX = textWidth - line.width;
    }

    let currentX = paddingLeft + offsetX;
    currentY += i === 0 ? line.height : line.lineHeight;

    for (const chunk of line.chunks) {
      renderTextChunk(currentX, currentY, chunk.text, chunk.style, context);
      currentX += chunk.metrics.width;
    }
  }
}

import type { UICanvasRenderingContext2D } from "../../miscellaneous/canvas";
import type { UITextSpan } from "../../miscellaneous/text-span/UITextSpan";
import { UITextStyle } from "../../miscellaneous/text-style/UITextStyle";
import type { UITextStyleConfig } from "../../miscellaneous/text-style/UITextStyle.Internal";
import { detectBidiClass } from "./UIText.Bidi";
import type { UIChunkMetrics, UITextChunk, UITextLine, UITextSize } from "./UIText.Interfaces";

/**
 * Applies font of a resolved style to a canvas context.
 * Shared by measuring and rendering so both stay in sync.
 * @param context Canvas context to configure
 * @param textStyle Resolved text style
 */
export function applyFontStyle(
  context: UICanvasRenderingContext2D,
  textStyle: UITextStyleConfig,
): void {
  context.font = `${textStyle.fontStyle} ${textStyle.fontWeight} ${textStyle.fontSize}px "${textStyle.fontFamily}"`;
}

/**
 * Splits text into renderable chunks.
 * @param text Text to split
 * @returns Array of words, spaces, and newlines
 */
export function splitTextIntoChunks(text: string): string[] {
  return text.match(/\S+|\s|\n/g) ?? [];
}

/**
 * Measures single text chunk.
 * @param context Canvas context for measurement
 * @param text Chunk text
 * @param textStyle Resolved text style
 * @returns Chunk metrics
 */
export function measureTextChunk(
  context: UICanvasRenderingContext2D,
  text: string,
  textStyle: UITextStyleConfig,
): UIChunkMetrics {
  applyFontStyle(context, textStyle);

  if (text === "\n") {
    return {
      width: 1,
      height: textStyle.lineHeight,
      baseline: 0,
      lineHeight: textStyle.lineHeight,
    };
  }

  const metrics = context.measureText(text);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent);

  return {
    width: Math.ceil(metrics.width),
    height: ascent + descent,
    baseline: ascent,
    lineHeight: textStyle.lineHeight,
  };
}

/**
 * Appends a line built from accumulated metrics.
 * Ascent and descent are separate because the tallest and deepest chunks may differ.
 * @param lines Lines to append to
 * @param chunks Chunks of the line
 * @param width Line width in pixels
 * @param ascent Maximum chunk ascent in pixels
 * @param descent Maximum chunk descent in pixels
 * @param lineHeight Maximum chunk line height in pixels
 */
function pushTextLine(
  lines: UITextLine[],
  chunks: UITextChunk[],
  width: number,
  ascent: number,
  descent: number,
  lineHeight: number,
): void {
  lines.push({
    chunks,
    width,
    height: ascent + descent,
    baseline: ascent,
    lineHeight,
  });
}

/**
 * Builds text lines with word wrapping.
 * @param maxWidth Maximum line width in pixels
 * @param textChunks Measured text chunks
 * @returns Array of text lines
 */
export function buildTextLines(maxWidth: number, textChunks: UITextChunk[]): UITextLine[] {
  const lines: UITextLine[] = [];
  let currentLine: UITextChunk[] = [];
  let currentWidth = 0;
  let currentAscent = 0;
  let currentDescent = 0;
  let currentLineHeight = 0;

  for (const textChunk of textChunks) {
    const ascent = textChunk.metrics.baseline;
    const descent = textChunk.metrics.height - textChunk.metrics.baseline;

    if (textChunk.text === "\n") {
      if (currentLine.length > 0) {
        pushTextLine(
          lines,
          currentLine,
          currentWidth,
          currentAscent,
          currentDescent,
          currentLineHeight,
        );
      }
      currentLine = [];
      currentWidth = 0;
      currentAscent = 0;
      currentDescent = 0;
      currentLineHeight = 0;
      continue;
    }

    if (currentLine.length === 0 || currentWidth + textChunk.metrics.width <= maxWidth) {
      currentLine.push(textChunk);
      currentWidth += textChunk.metrics.width;
      currentAscent = Math.max(currentAscent, ascent);
      currentDescent = Math.max(currentDescent, descent);
      currentLineHeight = Math.max(currentLineHeight, textChunk.metrics.lineHeight);
    } else {
      pushTextLine(
        lines,
        currentLine,
        currentWidth,
        currentAscent,
        currentDescent,
        currentLineHeight,
      );
      currentLine = [textChunk];
      currentWidth = textChunk.metrics.width;
      currentAscent = ascent;
      currentDescent = descent;
      currentLineHeight = textChunk.metrics.lineHeight;
    }
  }

  if (currentLine.length > 0) {
    pushTextLine(
      lines,
      currentLine,
      currentWidth,
      currentAscent,
      currentDescent,
      currentLineHeight,
    );
  }

  return lines;
}

/**
 * Calculates total text size from lines.
 * The box spans from the ascent of the first line to the descent of the last one.
 * @param lines Text lines
 * @returns Total width and height
 */
export function calculateTextSize(lines: UITextLine[]): UITextSize {
  if (lines.length === 0) {
    return { width: 0, height: 0 };
  }

  const maxLineWidth = Math.max(...lines.map((line) => line.width));
  const lastLine = lines[lines.length - 1];
  let totalHeight = lines[0].baseline;

  for (let i = 1; i < lines.length; i++) {
    totalHeight += lines[i].lineHeight;
  }

  return { width: maxLineWidth, height: totalHeight + lastLine.height - lastLine.baseline };
}

/**
 * Builds measured text chunks from spans.
 * @param context Canvas context for measurement
 * @param textSpans Text spans with styles
 * @param commonStyle Fallback style
 * @param isRTL Whether the paragraph reads right to left
 * @returns Measured text chunks
 */
export function buildTextChunks(
  context: UICanvasRenderingContext2D,
  textSpans: UITextSpan[],
  commonStyle: UITextStyle,
  isRTL: boolean,
): UITextChunk[] {
  context.direction = isRTL ? "rtl" : "ltr";

  const textChunks: UITextChunk[] = [];

  for (const textSpan of textSpans) {
    const textStyle = UITextStyle.resolve(textSpan.style, commonStyle);

    for (const textChunk of splitTextIntoChunks(textSpan.text)) {
      const textChunkMetrics = measureTextChunk(context, textChunk, textStyle);
      textChunks.push({
        text: textChunk,
        style: textStyle,
        metrics: textChunkMetrics,
        bidiClass: detectBidiClass(textChunk),
      });
    }
  }

  return textChunks;
}

/**
 * Calculates text layout parameters.
 * @param textChunks Measured text chunks
 * @param maxLineWidth Maximum line width in pixels
 * @returns Lines and total size
 */
export function calculateTextContentParameters(
  textChunks: UITextChunk[],
  maxLineWidth: number,
): { lines: UITextLine[]; size: UITextSize } {
  const lines = buildTextLines(maxLineWidth, textChunks);
  const size = calculateTextSize(lines);
  return { lines, size };
}

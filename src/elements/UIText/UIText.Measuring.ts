import type { UICanvasRenderingContext2D } from "../../miscellaneous/canvas";
import type { UITextSpan } from "../../miscellaneous/text-span/UITextSpan";
import { UITextStyle } from "../../miscellaneous/text-style/UITextStyle";
import type { UITextStyleConfig } from "../../miscellaneous/text-style/UITextStyle.Internal";
import type {
  UIChunkMetrics,
  UITextChunk,
  UITextLine,
  UITextSize,
} from "./UIText.Interfaces";

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
  context.font = `${textStyle.fontStyle} ${textStyle.fontWeight} ${textStyle.fontSize}px "${textStyle.fontFamily}"`;

  if (text === "\n") {
    return {
      width: Math.ceil(1),
      height: textStyle.lineHeight,
      baseline: 0,
      lineHeight: textStyle.lineHeight,
    };
  }

  const metrics = context.measureText(text);
  const width = Math.ceil(metrics.width);
  const height = Math.ceil(
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  );

  return {
    width,
    height,
    baseline: metrics.actualBoundingBoxDescent,
    lineHeight: textStyle.lineHeight,
  };
}

/**
 * Builds text lines with word wrapping.
 * @param maxWidth Maximum line width in pixels
 * @param textChunks Measured text chunks
 * @returns Array of text lines
 */
export function buildTextLines(
  maxWidth: number,
  textChunks: UITextChunk[],
): UITextLine[] {
  const lines: UITextLine[] = [];
  let currentLine: UITextChunk[] = [];
  let currentWidth = 0;
  let currentHeight = 0;
  let currentBaseline = 0;
  let currentLineHeight = 0;

  for (const textChunk of textChunks) {
    if (textChunk.text === "\n") {
      if (currentLine.length > 0) {
        lines.push({
          chunks: currentLine,
          width: currentWidth,
          height: currentHeight,
          baseline: currentBaseline,
          lineHeight: currentLineHeight,
        });
      }
      currentLine = [];
      currentWidth = 0;
      currentHeight = 0;
      currentBaseline = 0;
      currentLineHeight = 0;
      continue;
    }

    if (
      currentLine.length === 0 ||
      currentWidth + textChunk.metrics.width <= maxWidth
    ) {
      currentLine.push(textChunk);
      currentWidth += textChunk.metrics.width;
      currentHeight = Math.max(currentHeight, textChunk.metrics.height);
      currentBaseline = Math.max(currentBaseline, textChunk.metrics.baseline);
      currentLineHeight = Math.max(
        currentLineHeight,
        textChunk.metrics.lineHeight,
      );
    } else {
      lines.push({
        chunks: currentLine,
        width: currentWidth,
        height: currentHeight,
        baseline: currentBaseline,
        lineHeight: currentLineHeight,
      });
      currentLine = [textChunk];
      currentWidth = textChunk.metrics.width;
      currentHeight = textChunk.metrics.height;
      currentBaseline = textChunk.metrics.baseline;
      currentLineHeight = textChunk.metrics.lineHeight;
    }
  }

  if (currentLine.length > 0) {
    lines.push({
      chunks: currentLine,
      width: currentWidth,
      height: currentHeight,
      baseline: currentBaseline,
      lineHeight: currentLineHeight,
    });
  }

  return lines;
}

/**
 * Calculates total text size from lines.
 * @param lines Text lines
 * @returns Total width and height
 */
export function calculateTextSize(lines: UITextLine[]): UITextSize {
  if (lines.length === 0) {
    return { width: 0, height: 0 };
  }

  const maxLineWidth = Math.max(...lines.map((line) => line.width));
  let totalHeight = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    totalHeight += i === 0 ? line.height : line.lineHeight;
  }

  return { width: maxLineWidth, height: totalHeight };
}

/**
 * Builds measured text chunks from spans.
 * @param context Canvas context for measurement
 * @param textSpans Text spans with styles
 * @param commonStyle Fallback style
 * @returns Measured text chunks
 */
export function buildTextChunks(
  context: UICanvasRenderingContext2D,
  textSpans: UITextSpan[],
  commonStyle: UITextStyle,
): UITextChunk[] {
  const textChunks: UITextChunk[] = [];

  for (const textSpan of textSpans) {
    const textStyle = UITextStyle.resolve(textSpan.style, commonStyle);

    for (const textChunk of splitTextIntoChunks(textSpan.text)) {
      const textChunkMetrics = measureTextChunk(context, textChunk, textStyle);
      textChunks.push({
        text: textChunk,
        style: textStyle,
        metrics: textChunkMetrics,
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

import type { UICanvasRenderingContext2D } from "../../miscellaneous/canvas.js";
import type { UITextSpan } from "../../miscellaneous/text-span/UITextSpan.js";
import { UITextStyle } from "../../miscellaneous/text-style/UITextStyle.js";
import type { UITextStyleConfig } from "../../miscellaneous/text-style/UITextStyle.Internal.js";
import { detectBidiClass, reorderChunksVisually } from "./UIText.Bidi.js";
import type { UIChunkMetrics, UITextChunk, UITextLine, UITextSize } from "./UIText.Interfaces.js";

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
 * No-break spaces stay inside words, so a line never breaks at them.
 * @param text Text to split
 * @returns Array of words, spaces, and newlines
 */
export function splitTextIntoChunks(text: string): string[] {
  return text.match(/(?:\S|[\u00A0\u2007\u202F])+|\s/g) ?? [];
}

/**
 * Checks whether a chunk is a breakable space, which may end a line and is not drawn there.
 * @param textChunk Chunk to check
 * @returns True for a single breakable whitespace character other than a newline
 */
function isBreakableSpace(textChunk: UITextChunk): boolean {
  return textChunk.text !== "\n" && /^\s$/.test(textChunk.text);
}

/**
 * Rounds an overhang up; a negative or missing value means none, so a line never gets narrower
 * than its advances.
 * @param value Overhang in pixels
 * @returns Overhang in whole pixels, at least 0
 */
function ceilOverhang(value: number): number {
  return value > 0 ? Math.ceil(value) : 0;
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
      overhangLeft: 0,
      overhangRight: 0,
    };
  }

  const metrics = context.measureText(text);
  const ascent = Math.ceil(metrics.actualBoundingBoxAscent);
  const descent = Math.ceil(metrics.actualBoundingBoxDescent);
  const width = Math.ceil(metrics.width);

  return {
    width,
    height: ascent + descent,
    baseline: ascent,
    lineHeight: textStyle.lineHeight,
    overhangLeft: ceilOverhang(metrics.actualBoundingBoxLeft),
    overhangRight: ceilOverhang(metrics.actualBoundingBoxRight - width),
  };
}

/**
 * Builds a line from its chunks in logical order.
 * The width spans the glyphs, not only their advances: the left overhang of the visually first
 * chunk and the right overhang of the visually last one are part of it, so italic and swash
 * glyphs at the line edges are not cut.
 * @param chunks Chunks of the line without trailing spaces
 * @param emptyLineHeight Line height used when the line has no chunks
 * @param isRTL Whether the paragraph reads right to left
 * @returns Text line
 */
function buildTextLine(chunks: UITextChunk[], emptyLineHeight: number, isRTL: boolean): UITextLine {
  if (chunks.length === 0) {
    return {
      chunks,
      width: 0,
      height: 0,
      baseline: 0,
      lineHeight: emptyLineHeight,
      overhangLeft: 0,
      overhangRight: 0,
    };
  }

  let advance = 0;
  let ascent = 0;
  let descent = 0;
  let lineHeight = 0;

  for (const chunk of chunks) {
    advance += chunk.metrics.width;
    ascent = Math.max(ascent, chunk.metrics.baseline);
    descent = Math.max(descent, chunk.metrics.height - chunk.metrics.baseline);
    lineHeight = Math.max(lineHeight, chunk.metrics.lineHeight);
  }

  const visualChunks = reorderChunksVisually(chunks, isRTL);
  const overhangLeft = visualChunks[0].metrics.overhangLeft;
  const overhangRight = visualChunks[visualChunks.length - 1].metrics.overhangRight;

  return {
    chunks,
    width: overhangLeft + advance + overhangRight,
    height: ascent + descent,
    baseline: ascent,
    lineHeight,
    overhangLeft,
    overhangRight,
  };
}

/**
 * Removes breakable spaces from the end of a line.
 * @param chunks Chunks of the line in logical order
 * @returns The same chunks without trailing spaces
 */
function trimTrailingSpaces(chunks: UITextChunk[]): UITextChunk[] {
  let end = chunks.length;
  while (end > 0 && isBreakableSpace(chunks[end - 1])) {
    end--;
  }
  return end === chunks.length ? chunks : chunks.slice(0, end);
}

/**
 * Builds text lines with word wrapping.
 * Spaces behave as in a browser: a space never moves to the next line by itself, spaces at the
 * end of a line are not part of it, and a line made by wrapping does not start with a space.
 * Spaces at the start of the text and after a newline are kept. A newline always ends a line,
 * so two newlines in a row leave an empty line.
 * @param maxWidth Maximum line width in pixels
 * @param textChunks Measured text chunks
 * @param isRTL Whether the paragraph reads right to left
 * @returns Array of text lines
 */
export function buildTextLines(
  maxWidth: number,
  textChunks: UITextChunk[],
  isRTL: boolean,
): UITextLine[] {
  const lines: UITextLine[] = [];
  let currentLine: UITextChunk[] = [];
  let currentLineHeight = 0;
  let isWrapped = false;

  const pushLine = (): void => {
    lines.push(buildTextLine(trimTrailingSpaces(currentLine), currentLineHeight, isRTL));
    currentLine = [];
    currentLineHeight = 0;
  };

  for (const textChunk of textChunks) {
    if (textChunk.text === "\n") {
      currentLineHeight = Math.max(currentLineHeight, textChunk.metrics.lineHeight);
      pushLine();
      isWrapped = false;
      continue;
    }

    if (isBreakableSpace(textChunk)) {
      if (!(isWrapped && currentLine.length === 0)) {
        currentLine.push(textChunk);
        currentLineHeight = Math.max(currentLineHeight, textChunk.metrics.lineHeight);
      }
      continue;
    }

    const candidate =
      trimTrailingSpaces(currentLine).length === 0 ? null : [...currentLine, textChunk];
    if (candidate && buildTextLine(candidate, 0, isRTL).width > maxWidth) {
      pushLine();
      isWrapped = true;
    }

    currentLine.push(textChunk);
    currentLineHeight = Math.max(currentLineHeight, textChunk.metrics.lineHeight);
  }

  if (trimTrailingSpaces(currentLine).length > 0) {
    pushLine();
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
  context.textAlign = "left";

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
 * @param isRTL Whether the paragraph reads right to left
 * @returns Lines and total size
 */
export function calculateTextContentParameters(
  textChunks: UITextChunk[],
  maxLineWidth: number,
  isRTL: boolean,
): { lines: UITextLine[]; size: UITextSize } {
  const lines = buildTextLines(maxLineWidth, textChunks, isRTL);
  const size = calculateTextSize(lines);
  return { lines, size };
}

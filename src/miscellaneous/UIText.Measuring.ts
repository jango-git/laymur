import type { UITextSpan } from "./text-span/UITextSpan";
import { UITextStyle } from "./text-style/UITextStyle";
import type { UITextStyleConfig } from "./text-style/UITextStyle.Internal";
import type {
  UIChunkMetrics,
  UITextChunk,
  UITextLine,
  UITextSize,
} from "./UIText.Interfaces";

export function splitTextIntoChunks(text: string): string[] {
  return text.match(/\S+|\s|\n/g) ?? [];
}

export function measureTextChunk(
  context: OffscreenCanvasRenderingContext2D,
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

export function buildTextChunks(
  context: OffscreenCanvasRenderingContext2D,
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

export function calculateTextContentParameters(
  textChunks: UITextChunk[],
  maxLineWidth: number,
): { lines: UITextLine[]; size: UITextSize } {
  const lines = buildTextLines(maxLineWidth, textChunks);
  const size = calculateTextSize(lines);
  return { lines, size };
}

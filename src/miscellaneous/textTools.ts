import type {
  UIChunkMetrics,
  UITextChunk,
  UITextContent,
  UITextLine,
  UITextSize,
} from "./textInterfaces";
import { resolveTextStyle, type UITextStyle } from "./UITextStyle";

export function splitText(text: string): string[] {
  return text.match(/\S+|\s|\n/g) ?? [];
}

export function measureTextChunk(
  context: CanvasRenderingContext2D,
  chunk: string,
  style: UITextStyle,
): UIChunkMetrics {
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;

  if (chunk === "\n") {
    return {
      width: Math.ceil(0),
      height: style.lineHeight,
      baseline: 0,
      lineHeight: style.lineHeight,
    };
  }

  const metrics = context.measureText(chunk);
  const width = Math.ceil(metrics.width);
  const height = Math.ceil(
    metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent,
  );

  return {
    width,
    height,
    baseline: metrics.actualBoundingBoxDescent,
    lineHeight: style.lineHeight,
  };
}

export function buildLines(
  maxWidth: number,
  chunks: UITextChunk[],
): UITextLine[] {
  const lines: UITextLine[] = [];
  let currentLine: UITextChunk[] = [];
  let currentWidth = 0;
  let currentHeight = 0;
  let currentBaseline = 0;
  let currentLineHeight = 0;

  for (const chunk of chunks) {
    if (chunk.text === "\n") {
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
      currentWidth + chunk.metrics.width <= maxWidth ||
      currentLine.length === 0
    ) {
      currentLine.push(chunk);
      currentWidth += chunk.metrics.width;
      currentHeight = Math.max(currentHeight, chunk.metrics.height);
      currentBaseline = Math.max(currentBaseline, chunk.metrics.baseline);
      currentLineHeight = Math.max(currentLineHeight, chunk.metrics.lineHeight);
    } else {
      lines.push({
        chunks: currentLine,
        width: currentWidth,
        height: currentHeight,
        baseline: currentBaseline,
        lineHeight: currentLineHeight,
      });
      currentLine = [chunk];
      currentWidth = chunk.metrics.width;
      currentHeight = chunk.metrics.height;
      currentBaseline = chunk.metrics.baseline;
      currentLineHeight = chunk.metrics.lineHeight;
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

    if (i === lines.length - 1) {
      totalHeight += line.baseline;
    }
  }

  return {
    width: maxLineWidth,
    height: totalHeight,
  };
}

export function renderText(
  x: number,
  y: number,
  text: string,
  style: UITextStyle,
  context: CanvasRenderingContext2D,
): void {
  context.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;

  if (style.enableShadow) {
    context.shadowOffsetX = style.shadowOffsetX;
    context.shadowOffsetY = style.shadowOffsetY;
    context.shadowBlur = style.shadowBlur;
    context.shadowColor = style.shadowColor;
  }

  if (style.enableStroke) {
    context.strokeStyle = style.strokeColor;
    context.lineWidth = style.strokeWidth;
    context.strokeText(text, x, y);
  }

  context.fillStyle = style.color;
  context.fillText(text, x, y);
}

export function renderTextLines(
  paddingTop: number,
  paddingLeft: number,
  lines: UITextLine[],
  context: CanvasRenderingContext2D,
): void {
  let currentY = paddingTop;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let currentX = paddingLeft;
    currentY += i === 0 ? line.height : line.lineHeight;

    for (const chunk of line.chunks) {
      renderText(currentX, currentY, chunk.text, chunk.style, context);
      currentX += chunk.metrics.width;
    }
  }
}

const DEFAULT_MAX_LINE_WIDTH = 1024;

export function calculateTextContentParameters(
  context: CanvasRenderingContext2D,
  content: UITextContent,
  maxLineWidth: number = DEFAULT_MAX_LINE_WIDTH,
  commonStyle?: Partial<UITextStyle>,
): { lines: UITextLine[]; size: UITextSize } {
  const chunks: UITextChunk[] = [];

  for (const span of Array.isArray(content) ? content : [content]) {
    const isSpanString = typeof span === "string";
    const spanString = isSpanString ? span : span.text;
    const style = resolveTextStyle(
      isSpanString ? undefined : span.style,
      commonStyle,
    );

    for (const text of splitText(spanString)) {
      const metrics = measureTextChunk(context, text, style);
      chunks.push({ text, style, metrics });
    }
  }

  const lines = buildLines(maxLineWidth, chunks);
  const textSize = calculateTextSize(lines);

  return { lines, size: textSize };
}

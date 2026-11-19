import type { UICanvasRenderingContext2D } from "../../miscellaneous/canvas.js";
import type { UIPaintBox } from "../../miscellaneous/paint/UIPaint.Internal.js";
import { toCanvasPaint } from "../../miscellaneous/paint/UIPaint.js";
import type { UITextAlign } from "../../miscellaneous/text-style/UITextStyle.Internal.js";
import {
  TEXT_STYLE_DEFAULT_ALIGN,
  UITextPaintBox,
} from "../../miscellaneous/text-style/UITextStyle.Internal.js";
import { reorderChunksVisually } from "./UIText.Bidi.js";
import type { UITextChunk, UITextLine } from "./UIText.Interfaces.js";
import { applyFontStyle, calculateTextSize } from "./UIText.Measuring.js";

/** Color the silhouette casting a shadow is drawn with. The shadow takes only its alpha. */
const SILHOUETTE_COLOR = "#000000";

/** Chunk with the place it is drawn at */
interface UIPlacedChunk {
  /** Measured chunk */
  chunk: UITextChunk;
  /** Left edge of the advance, in pixels */
  x: number;
  /** Baseline, in pixels */
  y: number;
  /** Box gradients of the chunk are laid over */
  paintBox: UIPaintBox;
}

/** Canvas pixels per text pixel along each axis */
export interface UITextRasterScale {
  /** Horizontal scale */
  x: number;
  /** Vertical scale */
  y: number;
}

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
 * Places the visible chunks of the lines. Chunks are laid out left to right after visual
 * reordering, so x stays the left edge.
 * @param lines Text lines
 * @param isRTL Whether the paragraph reads right to left
 * @param paddingTop Top padding in pixels
 * @param paddingLeft Left padding in pixels
 * @returns Chunks with visible glyphs and their places
 */
function placeChunks(
  lines: UITextLine[],
  isRTL: boolean,
  paddingTop: number,
  paddingLeft: number,
): UIPlacedChunk[] {
  const textSize = calculateTextSize(lines);
  const textBox: UIPaintBox = {
    x: paddingLeft,
    y: paddingTop,
    width: textSize.width,
    height: textSize.height,
  };

  const placed: UIPlacedChunk[] = [];
  let currentY = paddingTop;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const firstAlign = line.chunks[0]?.style.align ?? TEXT_STYLE_DEFAULT_ALIGN;
    const isUniformAlign = line.chunks.every((c) => c.style.align === firstAlign);
    const lineAlign = resolveAlign(isUniformAlign ? firstAlign : TEXT_STYLE_DEFAULT_ALIGN, isRTL);

    let offsetX = 0;

    if (lineAlign === "center") {
      offsetX = (textSize.width - line.width) / 2;
    } else if (lineAlign === "right") {
      offsetX = textSize.width - line.width;
    }

    currentY += i === 0 ? line.baseline : line.lineHeight;

    const lineBox: UIPaintBox = {
      x: paddingLeft + offsetX,
      y: currentY - line.baseline,
      width: line.width,
      height: line.height,
    };

    let currentX = paddingLeft + offsetX + line.overhangLeft;

    for (const chunk of reorderChunksVisually(line.chunks, isRTL)) {
      if (chunk.text.trim() !== "") {
        placed.push({
          chunk,
          x: currentX,
          y: currentY,
          paintBox: chunk.style.paintBox === UITextPaintBox.TEXT ? textBox : lineBox,
        });
      }
      currentX += chunk.metrics.width;
    }
  }

  return placed;
}

/**
 * Total width of the outlines of a chunk up to a depth, inclusive.
 * @param chunk Measured chunk
 * @param depth Index of the outermost outline counted
 * @returns Width outside the glyphs in pixels
 */
function outlineWidth(chunk: UITextChunk, depth: number): number {
  let width = 0;
  for (let i = 0; i <= depth; i++) {
    width += chunk.style.strokes[i].thickness;
  }
  return width;
}

/**
 * Draws the shadows. Each one is cast by the silhouette of the outlined glyphs. The silhouette is
 * drawn outside the canvas and the shadow offset brings the shadow back, so only the shadow
 * lands. Shadow offsets and blur ignore the canvas transform and are scaled by hand.
 * @param context Canvas context
 * @param placed Placed chunks
 * @param scale Canvas pixels per text pixel
 */
function drawShadows(
  context: UICanvasRenderingContext2D,
  placed: UIPlacedChunk[],
  scale: UITextRasterScale,
): void {
  let depthCount = 0;
  for (const { chunk } of placed) {
    depthCount = Math.max(depthCount, chunk.style.shadows.length);
  }
  if (depthCount === 0) {
    return;
  }

  const shift = (context.canvas.width / scale.x) * 2;
  context.fillStyle = SILHOUETTE_COLOR;
  context.strokeStyle = SILHOUETTE_COLOR;

  for (let depth = depthCount - 1; depth >= 0; depth--) {
    for (const { chunk, x, y } of placed) {
      if (depth >= chunk.style.shadows.length) {
        continue;
      }
      const shadow = chunk.style.shadows[depth];

      applyFontStyle(context, chunk.style);
      context.shadowColor = shadow.color;
      context.shadowOffsetX = (shift + shadow.offsetX) * scale.x;
      context.shadowOffsetY = shadow.offsetY * scale.y;
      context.shadowBlur = (shadow.blur * (scale.x + scale.y)) / 2;

      const strokeCount = chunk.style.strokes.length;
      if (strokeCount > 0) {
        context.lineWidth = outlineWidth(chunk, strokeCount - 1) * 2;
        context.lineJoin = chunk.style.strokes[strokeCount - 1].join;
        context.strokeText(chunk.text, x - shift, y);
      }
      context.fillText(chunk.text, x - shift, y);
    }
  }

  context.shadowColor = "transparent";
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;
}

/**
 * Draws the outlines, the outermost of every chunk first, so an inner outline of one chunk is
 * never covered by an outer outline of its neighbour. A stroke is centered on its path, so it is
 * twice as wide as the outlines it reaches across.
 * @param context Canvas context
 * @param placed Placed chunks
 */
function drawStrokes(context: UICanvasRenderingContext2D, placed: UIPlacedChunk[]): void {
  let depthCount = 0;
  for (const { chunk } of placed) {
    depthCount = Math.max(depthCount, chunk.style.strokes.length);
  }

  for (let depth = depthCount - 1; depth >= 0; depth--) {
    for (const { chunk, x, y, paintBox } of placed) {
      if (depth >= chunk.style.strokes.length) {
        continue;
      }
      const stroke = chunk.style.strokes[depth];
      const width = outlineWidth(chunk, depth);
      if (width <= 0) {
        continue;
      }

      applyFontStyle(context, chunk.style);
      context.strokeStyle = toCanvasPaint(context, stroke.paint, paintBox);
      context.lineWidth = width * 2;
      context.lineJoin = stroke.join;
      context.strokeText(chunk.text, x, y);
    }
  }
}

/**
 * Draws the glyphs.
 * @param context Canvas context
 * @param placed Placed chunks
 */
function drawFills(context: UICanvasRenderingContext2D, placed: UIPlacedChunk[]): void {
  for (const { chunk, x, y, paintBox } of placed) {
    applyFontStyle(context, chunk.style);
    context.fillStyle = toCanvasPaint(context, chunk.style.color, paintBox);
    context.fillText(chunk.text, x, y);
  }
}

/**
 * Draws text lines on a cleared canvas whose transform maps text pixels onto it. Shadows of all
 * chunks go first, then outlines from the outermost, then the glyphs, so the layers of one span
 * never cover those of another.
 * @param context Canvas context
 * @param lines Text lines to render
 * @param isRTL Whether the paragraph reads right to left
 * @param paddingTop Top padding in pixels
 * @param paddingLeft Left padding in pixels
 * @param scale Canvas pixels per text pixel
 */
export function renderTextLines(
  context: UICanvasRenderingContext2D,
  lines: UITextLine[],
  isRTL: boolean,
  paddingTop: number,
  paddingLeft: number,
  scale: UITextRasterScale,
): void {
  context.direction = isRTL ? "rtl" : "ltr";
  context.textAlign = "left";

  const placed = placeChunks(lines, isRTL, paddingTop, paddingLeft);
  drawShadows(context, placed, scale);
  drawStrokes(context, placed);
  drawFills(context, placed);
}

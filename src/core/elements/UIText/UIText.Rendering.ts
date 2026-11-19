import type { UICanvas, UICanvasRenderingContext2D } from "../../miscellaneous/canvas.js";
import { createCanvas, getCanvas2DContext } from "../../miscellaneous/canvas.js";
import type { UIPaintBox } from "../../miscellaneous/paint/UIPaint.Internal.js";
import { toCanvasPaint } from "../../miscellaneous/paint/UIPaint.js";
import type {
  UITextAlign,
  UITextShadow,
} from "../../miscellaneous/text-style/UITextStyle.Internal.js";
import {
  TEXT_STYLE_DEFAULT_ALIGN,
  UITextPaintBox,
} from "../../miscellaneous/text-style/UITextStyle.Internal.js";
import { reorderChunksVisually } from "./UIText.Bidi.js";
import type { UITextChunk, UITextLine } from "./UIText.Interfaces.js";
import { applyFontStyle, calculateTextSize } from "./UIText.Measuring.js";

/** Color the silhouette casting a shadow is drawn with. The shadow takes only its alpha. */
const SILHOUETTE_COLOR = "#000000";

/** Canvas the silhouettes are drawn on, shared by all texts, created on first use and shrunk after */
let silhouetteCanvas: UICanvas | undefined;
let silhouetteContext: UICanvasRenderingContext2D | undefined;

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
 * Gives the shared silhouette canvas, cleared and sized like the target, with its transform.
 * @param target Canvas context the shadows are drawn on
 * @returns Silhouette canvas context
 * @throws If the browser gives no 2D context
 */
function prepareSilhouette(target: UICanvasRenderingContext2D): UICanvasRenderingContext2D {
  const { width, height } = target.canvas;
  if (silhouetteCanvas === undefined || silhouetteContext === undefined) {
    silhouetteCanvas = createCanvas(width, height);
    const context = getCanvas2DContext(silhouetteCanvas);
    if (!context) {
      throw new Error("UIText.renderTextLines: failed to create canvas context for shadows");
    }
    silhouetteContext = context;
  } else if (silhouetteCanvas.width !== width || silhouetteCanvas.height !== height) {
    silhouetteCanvas.width = width;
    silhouetteCanvas.height = height;
  }
  silhouetteContext.setTransform(1, 0, 0, 1, 0, 0);
  silhouetteContext.clearRect(0, 0, width, height);
  silhouetteContext.setTransform(target.getTransform());
  silhouetteContext.fillStyle = SILHOUETTE_COLOR;
  silhouetteContext.strokeStyle = SILHOUETTE_COLOR;
  return silhouetteContext;
}

/**
 * Draws the outlined glyphs of chunks in one color, as one shape.
 * @param context Silhouette canvas context
 * @param chunks Placed chunks
 */
function drawSilhouette(context: UICanvasRenderingContext2D, chunks: UIPlacedChunk[]): void {
  for (const { chunk, x, y } of chunks) {
    applyFontStyle(context, chunk.style);
    const strokeCount = chunk.style.strokes.length;
    if (strokeCount > 0) {
      context.lineWidth = outlineWidth(chunk, strokeCount - 1) * 2;
      context.lineJoin = chunk.style.strokes[strokeCount - 1].join;
      context.strokeText(chunk.text, x, y);
    }
    context.fillText(chunk.text, x, y);
  }
}

/**
 * Draws the shadows. A shadow is cast by one silhouette of all the outlined glyphs that have it,
 * so overlapping glyphs, outlines and neighbouring spans cast it once. The silhouette is drawn
 * one canvas width to the left of the target and the shadow offset brings the shadow back, so
 * only the shadow lands. Shadow offsets and blur ignore the canvas transform and are scaled by
 * hand. The shared silhouette canvas is shrunk afterwards, since a canvas keeps its memory while
 * it is large.
 * @param context Canvas context
 * @param placed Placed chunks
 */
function drawShadows(context: UICanvasRenderingContext2D, placed: UIPlacedChunk[]): void {
  let depthCount = 0;
  for (const { chunk } of placed) {
    depthCount = Math.max(depthCount, chunk.style.shadows.length);
  }
  if (depthCount === 0) {
    return;
  }

  const { a: scaleX, d: scaleY } = context.getTransform();
  const { width, height } = context.canvas;

  for (let depth = depthCount - 1; depth >= 0; depth--) {
    const groups = new Map<string, { shadow: UITextShadow; chunks: UIPlacedChunk[] }>();
    for (const item of placed) {
      const shadow = item.chunk.style.shadows[depth] as UITextShadow | undefined;
      if (shadow === undefined) {
        continue;
      }
      const key = `${shadow.color}|${shadow.offsetX}|${shadow.offsetY}|${shadow.blur}`;
      const group = groups.get(key);
      if (group === undefined) {
        groups.set(key, { shadow, chunks: [item] });
      } else {
        group.chunks.push(item);
      }
    }

    for (const { shadow, chunks } of groups.values()) {
      const silhouette = prepareSilhouette(context);
      drawSilhouette(silhouette, chunks);

      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.shadowColor = shadow.color;
      context.shadowOffsetX = width + shadow.offsetX * scaleX;
      context.shadowOffsetY = shadow.offsetY * scaleY;
      context.shadowBlur = (shadow.blur * (scaleX + scaleY)) / 2;
      context.drawImage(silhouette.canvas, -width, 0, width, height);
      context.restore();
    }
  }

  if (silhouetteCanvas !== undefined) {
    silhouetteCanvas.width = 1;
    silhouetteCanvas.height = 1;
  }
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
 */
export function renderTextLines(
  context: UICanvasRenderingContext2D,
  lines: UITextLine[],
  isRTL: boolean,
  paddingTop: number,
  paddingLeft: number,
): void {
  context.direction = isRTL ? "rtl" : "ltr";
  context.textAlign = "left";

  const placed = placeChunks(lines, isRTL, paddingTop, paddingLeft);
  drawShadows(context, placed);
  drawStrokes(context, placed);
  drawFills(context, placed);
}

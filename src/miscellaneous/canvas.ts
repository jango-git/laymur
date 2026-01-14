/** Canvas type that works both in main thread and workers */
export type UICanvas = OffscreenCanvas | HTMLCanvasElement;

/** 2D rendering context type for UICanvas */
export type UICanvasRenderingContext2D =
  | OffscreenCanvasRenderingContext2D
  | CanvasRenderingContext2D;

/**
 * Creates a canvas with OffscreenCanvas fallback to HTMLCanvasElement.
 * Uses OffscreenCanvas when available, falls back to HTMLCanvasElement otherwise.
 *
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns Canvas instance
 */
export function createCanvas(width: number, height: number): UICanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

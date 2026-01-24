import {
  CanvasTexture,
  ClampToEdgeWrapping,
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  UVMapping,
  SRGBColorSpace,
  NoColorSpace,
} from "three";
import { checkOffscreenCanvasSupport, checkSRGBSupport } from "./webglCapabilities";

/** Canvas type that works both in main thread and workers */
export type UICanvas = HTMLCanvasElement | OffscreenCanvas;

/** 2D rendering context type for UICanvas */
export type UICanvasRenderingContext2D =
  | CanvasRenderingContext2D
  | OffscreenCanvasRenderingContext2D;

/**
 * Creates a canvas using OffscreenCanvas if available, otherwise falls back to HTMLCanvasElement.
 *
 * @param width - Canvas width in pixels
 * @param height - Canvas height in pixels
 * @returns Canvas instance
 */
export function createCanvas(width: number, height: number): UICanvas {
  if (checkOffscreenCanvasSupport()) {
    return new OffscreenCanvas(width, height);
  }
  const canvasElement = document.createElement("canvas");
  canvasElement.width = width;
  canvasElement.height = height;
  return canvasElement;
}

/**
 * Gets the 2D rendering context for a UICanvas.
 *
 * @param canvas - Canvas instance
 * @returns 2D rendering context or null
 */
export function getCanvas2DContext(canvas: UICanvas): UICanvasRenderingContext2D | null {
  return canvas.getContext("2d");
}

/**
 * Creates a CanvasTexture with maximum WebGL1/WebGL2 compatibility.
 * - ClampToEdge wrapping (required for NPOT in WebGL1)
 * - Linear filtering without mipmaps (NPOT-safe)
 * - RGBA/UnsignedByte format (no extensions needed)
 * - sRGB colorspace only if supported
 *
 * @param canvas - Source canvas
 * @returns Configured CanvasTexture
 */
export function createCanvasTexture(canvas: UICanvas): CanvasTexture {
  const texture = new CanvasTexture(
    canvas,
    UVMapping,
    ClampToEdgeWrapping,
    ClampToEdgeWrapping,
    LinearFilter,
    LinearFilter,
    RGBAFormat,
    UnsignedByteType,
    1,
  );
  texture.colorSpace = checkSRGBSupport() ? SRGBColorSpace : NoColorSpace;
  texture.generateMipmaps = false;
  return texture;
}

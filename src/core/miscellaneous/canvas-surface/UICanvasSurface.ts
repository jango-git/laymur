import type { CanvasTexture } from "three";

import type { UICanvas, UICanvasRenderingContext2D } from "../canvas.js";
import { createCanvas, createCanvasTexture, getCanvas2DContext } from "../canvas.js";

/** Raster scales are rounded up to powers of two in steps of a quarter */
const RASTER_SCALE_STEPS_PER_OCTAVE = 4;
/** Longest side of a raster in pixels, kept within canvas limits of mobile browsers */
const RASTER_MAX_SIDE = 4096;
/** Smallest side of a raster in pixels */
const RASTER_MIN_SIDE = 2;

/**
 * Calculates the scale content is rasterized at. The required scale is rounded up to a step,
 * so content that resizes smoothly is redrawn only when it crosses a step, and at most about 19%
 * sharper than needed. The scale is then lowered until the longer side fits the raster limit.
 * @param width Content width in content units
 * @param height Content height in content units
 * @param requiredScale Raster pixels per content unit needed for the content to look sharp
 * @returns Raster pixels per content unit
 */
export function calculateRasterScale(width: number, height: number, requiredScale: number): number {
  const steps = Math.ceil(Math.log2(requiredScale) * RASTER_SCALE_STEPS_PER_OCTAVE - 1e-6);
  const scale = Math.pow(2, steps / RASTER_SCALE_STEPS_PER_OCTAVE);
  return Math.min(scale, RASTER_MAX_SIDE / Math.max(width, height, 1));
}

/**
 * Canvas drawn into a texture. Owns the canvas, its 2D context and the texture. A texture of
 * another size is created anew, since three.js cannot resize an uploaded texture.
 */
export class UICanvasSurface {
  public readonly canvas: UICanvas;
  public readonly context: UICanvasRenderingContext2D;
  private textureInternal: CanvasTexture;
  private scaleXInternal = 1;
  private scaleYInternal = 1;

  /**
   * @param subject Name of the owner, used in errors
   * @throws If the browser gives no 2D context
   */
  constructor(subject: string) {
    this.canvas = createCanvas(RASTER_MIN_SIDE, RASTER_MIN_SIDE);
    const context = getCanvas2DContext(this.canvas);
    if (!context) {
      throw new Error(`${subject}: failed to create canvas context`);
    }
    this.context = context;
    this.textureInternal = createCanvasTexture(this.canvas);
    this.textureInternal.needsUpdate = true;
  }

  /** Texture showing the canvas */
  public get texture(): CanvasTexture {
    return this.textureInternal;
  }

  /** Canvas pixels per content unit horizontally, as set by the last `begin` */
  public get scaleX(): number {
    return this.scaleXInternal;
  }

  /** Canvas pixels per content unit vertically, as set by the last `begin` */
  public get scaleY(): number {
    return this.scaleYInternal;
  }

  /**
   * Sizes the canvas for content rasterized at a scale and clears it. The canvas sides are whole
   * pixels, so the transform the context is left with maps the content exactly onto them, and the
   * content is drawn in content units.
   * @param width Content width in content units
   * @param height Content height in content units
   * @param scale Raster pixels per content unit
   * @returns True when the texture was replaced and the new one has to be passed to the plane
   */
  public begin(width: number, height: number, scale: number): boolean {
    const canvasWidth = Math.max(Math.ceil(width * scale), RASTER_MIN_SIDE);
    const canvasHeight = Math.max(Math.ceil(height * scale), RASTER_MIN_SIDE);
    const resized = this.canvas.width !== canvasWidth || this.canvas.height !== canvasHeight;

    if (resized) {
      this.canvas.width = canvasWidth;
      this.canvas.height = canvasHeight;
      this.textureInternal.dispose();
      this.textureInternal = createCanvasTexture(this.canvas);
    }

    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, canvasWidth, canvasHeight);
    this.scaleXInternal = canvasWidth / width;
    this.scaleYInternal = canvasHeight / height;
    this.context.setTransform(this.scaleXInternal, 0, 0, this.scaleYInternal, 0, 0);
    this.textureInternal.needsUpdate = true;
    return resized;
  }

  /** Frees the texture */
  public dispose(): void {
    this.textureInternal.dispose();
  }
}

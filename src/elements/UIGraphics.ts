import { CanvasTexture, LinearFilter } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIColor, UIColorEvent } from "../miscellaneous/UIColor";
import source from "../shaders/UIDefaultShader.glsl";
import { UIElement } from "./UIElement";

/**
 * Configuration options for creating a UIGraphics element.
 */
export interface UIGraphicsOptions {
  /** X position of the element */
  x?: number;
  /** Y position of the element */
  y?: number;
  /** Width of the canvas (default: 512) */
  width?: number;
  /** Height of the canvas (default: 512) */
  height?: number;
  /** Color tint applied to the graphics */
  color?: UIColor;
}

/**
 * UI element for drawing graphics using 2D canvas API.
 *
 * UIGraphics uses an OffscreenCanvas for rendering 2D graphics and converts it
 * to a Three.js texture for display. It provides access to the canvas context
 * for custom drawing operations.
 */
export class UIGraphics extends UIElement {
  /** OffscreenCanvas for rendering graphics */
  private readonly canvas: OffscreenCanvas;
  /** 2D rendering context */
  private readonly ctx: OffscreenCanvasRenderingContext2D;
  /** Three.js texture created from the canvas */
  private readonly canvasTexture: CanvasTexture;
  /** Internal storage for the color tint */
  private readonly colorInternal: UIColor;

  /**
   * Creates a new UIGraphics instance.
   *
   * @param layer - The UI layer that contains this graphics element
   * @param options - Configuration options for the graphics element
   */
  constructor(layer: UILayer, options: UIGraphicsOptions = {}) {
    const defaultCanvasSize = 512;
    const width = options.width ?? defaultCanvasSize;
    const height = options.height ?? defaultCanvasSize;
    const color = options.color ?? new UIColor();

    // Create OffscreenCanvas
    const canvas = new OffscreenCanvas(width, height);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get 2D context from OffscreenCanvas");
    }

    // Create texture from canvas
    const canvasTexture = new CanvasTexture(canvas);
    canvasTexture.minFilter = LinearFilter;
    canvasTexture.magFilter = LinearFilter;

    super(layer, options.x ?? 0, options.y ?? 0, width, height, source, {
      map: canvasTexture,
      uvTransform: canvasTexture.matrix,
      color,
    });

    this.canvas = canvas;
    this.ctx = ctx;
    this.canvasTexture = canvasTexture;
    this.colorInternal = color;
    this.colorInternal.on(UIColorEvent.CHANGE, this.onColorChange);
  }

  /**
   * Gets the canvas width.
   */
  public get canvasWidth(): number {
    return this.canvas.width;
  }

  /**
   * Gets the canvas height.
   */
  public get canvasHeight(): number {
    return this.canvas.height;
  }

  /**
   * Gets the current color tint applied to the graphics.
   */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /**
   * Sets the color tint applied to the graphics.
   */
  public set color(value: UIColor) {
    this.colorInternal.copy(value);
  }

  /**
   * Clears the canvas with optional fill color.
   *
   * @param fillColor - Optional color to fill after clearing (CSS color string)
   */
  public clear(fillColor?: string): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (fillColor !== undefined) {
      this.ctx.fillStyle = fillColor;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Draws a rectangle on the canvas.
   */
  public rect(x: number, y: number, width: number, height: number): void {
    this.ctx.rect(x, y, width, height);
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Draws a filled rectangle on the canvas.
   */
  public fillRect(x: number, y: number, width: number, height: number): void {
    this.ctx.fillRect(x, y, width, height);
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Draws a stroked rectangle on the canvas.
   */
  public strokeRect(x: number, y: number, width: number, height: number): void {
    this.ctx.strokeRect(x, y, width, height);
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Draws a circle on the canvas.
   */
  public circle(x: number, y: number, radius: number): void {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.closePath();
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Begins a new path.
   */
  public beginPath(): void {
    this.ctx.beginPath();
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Closes the current path.
   */
  public closePath(): void {
    this.ctx.closePath();
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Fills the current path.
   */
  public fill(): void {
    this.ctx.fill();
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Strokes the current path.
   */
  public stroke(): void {
    this.ctx.stroke();
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Moves the path to a point.
   */
  public moveTo(x: number, y: number): void {
    this.ctx.moveTo(x, y);
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Draws a line to a point.
   */
  public lineTo(x: number, y: number): void {
    this.ctx.lineTo(x, y);
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Sets the fill style.
   */
  public setFillStyle(style: string | CanvasGradient | CanvasPattern): void {
    this.ctx.fillStyle = style;
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Sets the stroke style.
   */
  public setStrokeStyle(style: string | CanvasGradient | CanvasPattern): void {
    this.ctx.strokeStyle = style;
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Sets the line width.
   */
  public setLineWidth(width: number): void {
    this.ctx.lineWidth = width;
    this.canvasTexture.needsUpdate = true;
  }

  /**
   * Destroys the graphics element by cleaning up resources.
   */
  public override destroy(): void {
    this.colorInternal.off(UIColorEvent.CHANGE, this.onColorChange);
    this.canvasTexture.dispose();
    super.destroy();
  }

  /** Event handler for when the color changes */
  private readonly onColorChange = (color: UIColor): void => {
    this.sceneWrapper.setUniform(this.planeHandler, "color", color);
  };
}

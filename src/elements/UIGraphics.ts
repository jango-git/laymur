import type { WebGLRenderer } from "three";
import { CanvasTexture, LinearFilter } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIColor } from "../miscellaneous/color/UIColor";
import type { UIElementCommonOptions } from "../miscellaneous/UIElementCommonOptions";
import source from "../shaders/UIImage.glsl";
import { UIElement } from "./UIElement";

const DEFAULT_CANVAS_RESOLUTION = 32;

/**
 * UI element for drawing graphics using 2D canvas API.
 *
 * UIGraphics uses an OffscreenCanvas for rendering 2D graphics and converts it
 * to a Three.js texture for display. It provides access to the canvas context
 * for custom drawing operations.
 */
export class UIGraphics extends UIElement {
  public readonly color: UIColor;

  /** OffscreenCanvas for rendering graphics */
  private readonly canvas: OffscreenCanvas;
  /** 2D rendering context */
  private readonly ctx: OffscreenCanvasRenderingContext2D;
  /** Three.js texture created from the canvas */
  private readonly texture: CanvasTexture;

  /**
   * Creates a new UIGraphics instance.
   *
   * @param layer - The UI layer that contains this graphics element
   * @param options - Configuration options for the graphics element
   */
  constructor(layer: UILayer, options: Partial<UIElementCommonOptions> = {}) {
    const w = options.width ?? DEFAULT_CANVAS_RESOLUTION;
    const h = options.height ?? DEFAULT_CANVAS_RESOLUTION;
    const color = new UIColor(options.color);

    const canvas = new OffscreenCanvas(w, h);
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      throw new Error("Failed to get 2D context from OffscreenCanvas");
    }

    const texture = new CanvasTexture(canvas);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;

    super(layer, options.x ?? 0, options.y ?? 0, w, h, source, {
      texture: texture,
      textureTransform: texture.matrix,
      color,
    });

    this.color = color;
    this.mode = options.mode ?? this.mode;

    this.canvas = canvas;
    this.ctx = ctx;
    this.texture = texture;
  }

  /**
   * Clears the canvas with optional fill color.
   *
   * @param fillColor - Optional color to fill after clearing
   */
  public clear(fillColor?: UIColor): this {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (fillColor !== undefined) {
      this.ctx.fillStyle = fillColor.toCSSColor();
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Draws a rectangle on the canvas.
   */
  public rect(x: number, y: number, width: number, height: number): this {
    this.ctx.rect(x, y, width, height);
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Draws a filled rectangle on the canvas.
   */
  public fillRect(x: number, y: number, width: number, height: number): this {
    this.ctx.fillRect(x, y, width, height);
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Draws a stroked rectangle on the canvas.
   */
  public strokeRect(x: number, y: number, width: number, height: number): this {
    this.ctx.strokeRect(x, y, width, height);
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Draws a circle on the canvas.
   */
  public circle(x: number, y: number, radius: number): this {
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    this.ctx.closePath();
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Begins a new path.
   */
  public beginPath(): this {
    this.ctx.beginPath();
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Closes the current path.
   */
  public closePath(): this {
    this.ctx.closePath();
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Fills the current path.
   */
  public fill(): this {
    this.ctx.fill();
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Strokes the current path.
   */
  public stroke(): this {
    this.ctx.stroke();
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Moves the path to a point.
   */
  public moveTo(x: number, y: number): this {
    this.ctx.moveTo(x, y);
    return this;
  }

  /**
   * Draws a line to a point.
   */
  public lineTo(x: number, y: number): this {
    this.ctx.lineTo(x, y);
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Sets the fill style.
   */
  public setFillStyle(style: UIColor | CanvasGradient | CanvasPattern): this {
    this.ctx.fillStyle = style instanceof UIColor ? style.toCSSColor() : style;
    return this;
  }

  /**
   * Sets the stroke style.
   */
  public setStrokeStyle(style: UIColor | CanvasGradient | CanvasPattern): this {
    this.ctx.strokeStyle =
      style instanceof UIColor ? style.toCSSColor() : style;
    return this;
  }

  /**
   * Sets the line width.
   */
  public setLineWidth(width: number): this {
    this.ctx.lineWidth = width;
    return this;
  }

  /**
   * Destroys the graphics element by cleaning up resources.
   */
  public override destroy(): void {
    this.texture.dispose();
    super.destroy();
  }

  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    if (this.color.dirty) {
      this.sceneWrapper.setProperties(this.planeHandler, {
        color: this.color,
      });
      this.color.dirty = false;
    }
    super.onWillRender(renderer, deltaTime);
  }
}

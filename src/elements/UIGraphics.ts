import type { WebGLRenderer } from "three";
import { CanvasTexture, LinearFilter } from "three";
import type { UILayer } from "../layers/UILayer";
import { UIColor } from "../miscellaneous/color/UIColor";
import source from "../shaders/UIImage.glsl";
import { DUMMY_DEFAULT_HEIGHT, DUMMY_DEFAULT_WIDTH } from "./UIDummy.Internal";
import { UIElement } from "./UIElement";
import type { UIGraphicsOptions } from "./UIGraphics.Internal";

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
  private readonly context: OffscreenCanvasRenderingContext2D;
  /** Three.js texture created from the canvas */
  private readonly texture: CanvasTexture;

  /**
   * Creates a new UIGraphics instance.
   *
   * @param layer - The UI layer that contains this graphics element
   * @param options - Configuration options for the graphics element
   */
  constructor(layer: UILayer, options?: Partial<UIGraphicsOptions>) {
    const w = options?.width ?? DUMMY_DEFAULT_WIDTH;
    const h = options?.width ?? DUMMY_DEFAULT_HEIGHT;
    const color = new UIColor(options?.color);

    const canvas = new OffscreenCanvas(w, h);
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "UIGraphics.constructor: failed to get 2D context from OffscreenCanvas",
      );
    }

    const texture = new CanvasTexture(canvas);
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;

    super(
      layer,
      source,
      {
        texture: texture,
        textureTransform: texture.matrix,
        color,
      },
      options,
    );

    this.canvas = canvas;
    this.context = context;
    this.texture = texture;
    this.color = color;
  }

  /**
   * Clears the canvas and optionally fills it with a color.
   *
   * @param color - Optional color to fill the canvas after clearing
   */
  public clear(color?: UIColor): this {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (color !== undefined) {
      this.context.fillStyle = color.toCSSColor();
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Draws a filled rectangle.
   *
   * @param x - X coordinate of the rectangle's top-left corner
   * @param y - Y coordinate of the rectangle's top-left corner
   * @param width - Width of the rectangle
   * @param height - Height of the rectangle
   * @param color - Fill color
   */
  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: UIColor,
  ): this {
    this.context.fillStyle = color.toCSSColor();
    this.context.fillRect(x, y, width, height);
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Draws a filled circle.
   *
   * @param x - X coordinate of the circle's center
   * @param y - Y coordinate of the circle's center
   * @param radius - Radius of the circle
   * @param color - Fill color
   */
  public drawCircle(
    x: number,
    y: number,
    radius: number,
    color: UIColor,
  ): this {
    this.context.fillStyle = color.toCSSColor();
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, Math.PI * 2);
    this.context.fill();
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Draws an arc (partial circle).
   *
   * @param x - X coordinate of the arc's center
   * @param y - Y coordinate of the arc's center
   * @param radius - Radius of the arc
   * @param startAngle - Start angle in radians
   * @param endAngle - End angle in radians
   * @param color - Fill color
   */
  public drawArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: UIColor,
  ): this {
    this.context.fillStyle = color.toCSSColor();
    this.context.beginPath();
    this.context.arc(x, y, radius, startAngle, endAngle);
    this.context.fill();
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Draws a polyline (connected line segments).
   *
   * @param points - Array of points as [x, y] pairs
   * @param color - Stroke color
   * @param lineWidth - Width of the line (default: 1)
   */
  public drawPolyline(
    points: [number, number][],
    color: UIColor,
    lineWidth = 1,
  ): this {
    if (points.length < 2) {
      return this;
    }

    this.context.strokeStyle = color.toCSSColor();
    this.context.lineWidth = lineWidth;
    this.context.beginPath();
    this.context.moveTo(points[0][0], points[0][1]);

    for (let i = 1; i < points.length; i++) {
      this.context.lineTo(points[i][0], points[i][1]);
    }

    this.context.stroke();
    this.texture.needsUpdate = true;
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
      this.sceneWrapper.setProperties(this.planeHandler, { color: this.color });
      this.color.setDirtyFalse();
    }
    super.onWillRender(renderer, deltaTime);
  }
}

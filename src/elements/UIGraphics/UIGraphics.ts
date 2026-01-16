import type { CanvasTexture, WebGLRenderer } from "three";
import { Matrix3 } from "three";
import type { UILayer } from "../../layers/UILayer/UILayer";
import type {
  UICanvas,
  UICanvasRenderingContext2D,
} from "../../miscellaneous/canvas";
import { createCanvas, createCanvasTexture } from "../../miscellaneous/canvas";
import { UIColor } from "../../miscellaneous/color/UIColor";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import source from "../../shaders/UIImage.glsl";
import { UIElement } from "../UIElement/UIElement";
import {
  GRAPHICS_DEFAULT_HEIGHT,
  GRAPHICS_DEFAULT_WIDTH,
  GRAPHICS_TEMP_COLOR,
  type UIGraphicsOptions,
} from "./UIGraphics.Internal";

/** Canvas-based 2D drawing element */
export class UIGraphics extends UIElement {
  private readonly colorInternal: UIColor;
  private readonly canvas: UICanvas;
  private readonly context: UICanvasRenderingContext2D;
  private readonly texture: CanvasTexture;

  /**
   * Creates a new UIGraphics instance.
   *
   * @param layer - Layer containing this element
   * @param options - Configuration options
   */
  constructor(layer: UILayer, options?: Partial<UIGraphicsOptions>) {
    const w = options?.width ?? GRAPHICS_DEFAULT_WIDTH;
    const h = options?.height ?? GRAPHICS_DEFAULT_HEIGHT;
    const color = new UIColor(options?.color);

    const canvas = createCanvas(w, h);
    const context = canvas.getContext("2d") as UICanvasRenderingContext2D | null;

    if (!context) {
      throw new Error(
        "UIGraphics.constructor: failed to get 2D context from canvas",
      );
    }

    const texture = createCanvasTexture(canvas);
    texture.needsUpdate = true;

    super(
      layer,
      source,
      {
        texture: texture,
        textureTransform: new Matrix3(),
        color,
      },
      options,
    );

    this.canvas = canvas;
    this.context = context;
    this.texture = texture;
    this.colorInternal = color;
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public get color(): UIColor {
    return this.colorInternal;
  }

  /** Multiplicative tint. Alpha channel controls opacity. */
  public set color(value: UIColorConfig) {
    this.colorInternal.set(value);
  }

  /**
   * Clears canvas. Optionally fills with color.
   *
   * @param color - Fill color after clearing
   */
  public clear(color?: UIColorConfig): this {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (color !== undefined) {
      this.context.fillStyle = GRAPHICS_TEMP_COLOR.set(color).toCSSColor();
      this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    this.texture.needsUpdate = true;
    return this;
  }

  /** Draws filled rectangle */
  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    color: UIColorConfig,
  ): this {
    this.context.fillStyle = GRAPHICS_TEMP_COLOR.set(color).toCSSColor();
    this.context.fillRect(x, y, width, height);
    this.texture.needsUpdate = true;
    return this;
  }

  /** Draws filled circle */
  public drawCircle(
    x: number,
    y: number,
    radius: number,
    color: UIColorConfig,
  ): this {
    this.context.fillStyle = GRAPHICS_TEMP_COLOR.set(color).toCSSColor();
    this.context.beginPath();
    this.context.arc(x, y, radius, 0, Math.PI * 2);
    this.context.fill();
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Draws filled arc.
   *
   * @param startAngle - Start angle in radians
   * @param endAngle - End angle in radians
   */
  public drawArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    color: UIColorConfig,
  ): this {
    this.context.fillStyle = GRAPHICS_TEMP_COLOR.set(color).toCSSColor();
    this.context.beginPath();
    this.context.arc(x, y, radius, startAngle, endAngle);
    this.context.fill();
    this.texture.needsUpdate = true;
    return this;
  }

  /**
   * Draws connected line segments.
   *
   * @param points - Array of [x, y] pairs
   * @param lineWidth - Line width in pixels
   */
  public drawPolyline(
    points: [number, number][],
    color: UIColor,
    lineWidth = 1,
  ): this {
    if (points.length < 2) {
      return this;
    }

    this.context.strokeStyle = GRAPHICS_TEMP_COLOR.set(color).toCSSColor();
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

  /** Removes element and frees resources */
  public override destroy(): void {
    this.texture.dispose();
    super.destroy();
  }

  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    if (this.colorInternal.dirty) {
      this.sceneWrapper.setProperties(this.planeHandler, {
        color: this.colorInternal,
      });
      this.colorInternal.setDirtyFalse();
    }

    super.onWillRender(renderer, deltaTime);
  }
}

import type { WebGLRenderer } from "three";
import { CanvasTexture, LinearFilter, SRGBColorSpace } from "three";
import type { UILayer } from "../../layers/UILayer";
import { UIColor } from "../../miscellaneous/color/UIColor";
import source from "../../shaders/UIImage.glsl";
import { UIElement } from "../UIElement/UIElement";
import {
  DUMMY_DEFAULT_HEIGHT,
  DUMMY_DEFAULT_WIDTH,
} from "../UIInputDummy/UIInputDummy.Internal";
import {
  GRAPHICS_TEMP_PROPERTIES,
  type UIGraphicsOptions,
} from "./UIGraphics.Internal";

/** Canvas-based 2D drawing element */
export class UIGraphics extends UIElement {
  /** Multiplicative tint. Alpha channel controls opacity. */
  public readonly color: UIColor;

  private readonly canvas: OffscreenCanvas;
  private readonly context: OffscreenCanvasRenderingContext2D;
  private readonly texture: CanvasTexture;

  /**
   * Creates a new UIGraphics instance.
   *
   * @param layer - Layer containing this element
   * @param options - Configuration options
   */
  constructor(layer: UILayer, options?: Partial<UIGraphicsOptions>) {
    const w = options?.width ?? DUMMY_DEFAULT_WIDTH;
    const h = options?.height ?? DUMMY_DEFAULT_HEIGHT;
    const color = new UIColor(options?.color);

    const canvas = new OffscreenCanvas(w, h);
    const context = canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "UIGraphics.constructor: failed to get 2D context from OffscreenCanvas",
      );
    }

    const texture = new CanvasTexture(canvas);
    texture.colorSpace = SRGBColorSpace;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.needsUpdate = true;

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
   * Clears canvas. Optionally fills with color.
   *
   * @param color - Fill color after clearing
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

  /** Draws filled rectangle */
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

  /** Draws filled circle */
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

  /** Removes element and frees resources */
  public override destroy(): void {
    this.texture.dispose();
    super.destroy();
  }

  protected override onWillRender(
    renderer: WebGLRenderer,
    deltaTime: number,
  ): void {
    if (this.color.dirty) {
      GRAPHICS_TEMP_PROPERTIES["color"] = this.color;
      this.color.setDirtyFalse();
    } else {
      delete GRAPHICS_TEMP_PROPERTIES["color"];
    }
    this.sceneWrapper.setProperties(
      this.planeHandler,
      GRAPHICS_TEMP_PROPERTIES,
    );
    super.onWillRender(renderer, deltaTime);
  }
}

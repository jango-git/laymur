import type { WebGLRenderer } from "three";

import type { UILayer } from "../../layers/UILayer/UILayer.js";
import { assertValidNonNegativeNumber, assertValidNumber } from "../../miscellaneous/asserts.js";
import {
  calculateRasterScale,
  UICanvasSurface,
} from "../../miscellaneous/canvas-surface/UICanvasSurface.js";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal.js";
import { UIColor } from "../../miscellaneous/color/UIColor.js";
import type { Vector2Like } from "../../miscellaneous/math.js";
import type { UIPaintBox, UIPaintConfig } from "../../miscellaneous/paint/UIPaint.Internal.js";
import { resolvePaint, toCanvasPaint } from "../../miscellaneous/paint/UIPaint.js";
import { UIAffineMatrix3 } from "../../miscellaneous/UIAffineMatrix3.js";
import source from "../../shaders/UIImage.js";
import { UIElement } from "../UIElement/UIElement.js";
import type {
  UIGraphicsCornerRadius,
  UIGraphicsOptions,
  UIGraphicsShape,
  UIGraphicsStrokeConfig,
  UIGraphicsStyle,
} from "./UIGraphics.Internal.js";
import {
  GRAPHICS_DEFAULT_HEIGHT,
  GRAPHICS_DEFAULT_STROKE_CAP,
  GRAPHICS_DEFAULT_STROKE_JOIN,
  GRAPHICS_DEFAULT_WIDTH,
} from "./UIGraphics.Internal.js";

/**
 * Bounds of a list of points.
 * @param points Points to bound
 * @returns Box around the points
 */
function boundPoints(points: readonly Vector2Like[]): UIPaintBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * Canvas-based 2D vector drawing element. Shapes are drawn in a drawing box as large as the
 * width and height the element is created with, from its top left corner with y pointing down,
 * and the box is stretched over the element. The shapes are kept until `clear` and drawn again
 * at the size the element takes on the screen, so they stay sharp when constraints enlarge it
 * and on high-DPI screens.
 */
export class UIGraphics extends UIElement {
  private readonly colorInternal: UIColor;
  private readonly surface: UICanvasSurface;
  private readonly drawingWidth: number;
  private readonly drawingHeight: number;

  private readonly shapes: UIGraphicsShape[] = [];
  private shapesDirty = true;

  /** Raster scale the canvas holds, NaN before the first drawing */
  private rasterScale = Number.NaN;
  private rasterPixelDensity = Number.NaN;

  /**
   * Creates a new UIGraphics instance.
   *
   * @param layer - Layer containing this element
   * @param options - Configuration options. The width and height also set the drawing box.
   */
  constructor(layer: UILayer, options?: Partial<UIGraphicsOptions>) {
    const color = new UIColor(options?.color);
    const surface = new UICanvasSurface("UIGraphics.constructor");

    super(
      layer,
      source,
      {
        texture: surface.texture,
        textureTransform: new UIAffineMatrix3(),
        color,
      },
      options,
    );

    this.surface = surface;
    this.colorInternal = color;
    this.drawingWidth = options?.width ?? GRAPHICS_DEFAULT_WIDTH;
    this.drawingHeight = options?.height ?? GRAPHICS_DEFAULT_HEIGHT;
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
   * Removes all shapes. Optionally fills the drawing box.
   *
   * @param fill - Color or gradient filling the box after clearing
   */
  public clear(fill?: UIPaintConfig): this {
    this.shapes.length = 0;
    this.shapesDirty = true;
    if (fill !== undefined) {
      this.drawRect(0, 0, this.drawingWidth, this.drawingHeight, { fill });
    }
    return this;
  }

  /** Draws a rectangle */
  public drawRect(
    x: number,
    y: number,
    width: number,
    height: number,
    style: UIGraphicsStyle,
  ): this {
    assertValidNumber(x, "UIGraphics.drawRect.x");
    assertValidNumber(y, "UIGraphics.drawRect.y");
    assertValidNonNegativeNumber(width, "UIGraphics.drawRect.width");
    assertValidNonNegativeNumber(height, "UIGraphics.drawRect.height");
    return this.addShape({ x, y, width, height }, style, (context) => {
      context.rect(x, y, width, height);
    });
  }

  /**
   * Draws a rectangle with rounded corners. Each radius is clamped to half of the shorter side.
   *
   * @param radius - One radius for all corners, or four from the top left clockwise
   */
  public drawRoundedRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: UIGraphicsCornerRadius,
    style: UIGraphicsStyle,
  ): this {
    assertValidNumber(x, "UIGraphics.drawRoundedRect.x");
    assertValidNumber(y, "UIGraphics.drawRoundedRect.y");
    assertValidNonNegativeNumber(width, "UIGraphics.drawRoundedRect.width");
    assertValidNonNegativeNumber(height, "UIGraphics.drawRoundedRect.height");

    const limit = Math.min(width, height) / 2;
    const radii = (typeof radius === "number" ? [radius, radius, radius, radius] : radius).map(
      (value) => {
        assertValidNonNegativeNumber(value, "UIGraphics.drawRoundedRect.radius");
        return Math.min(value, limit);
      },
    );
    const [topLeft, topRight, bottomRight, bottomLeft] = radii;
    const right = x + width;
    const bottom = y + height;

    return this.addShape({ x, y, width, height }, style, (context) => {
      context.moveTo(x + topLeft, y);
      context.arcTo(right, y, right, bottom, topRight);
      context.arcTo(right, bottom, x, bottom, bottomRight);
      context.arcTo(x, bottom, x, y, bottomLeft);
      context.arcTo(x, y, right, y, topLeft);
      context.closePath();
    });
  }

  /** Draws a circle */
  public drawCircle(x: number, y: number, radius: number, style: UIGraphicsStyle): this {
    assertValidNumber(x, "UIGraphics.drawCircle.x");
    assertValidNumber(y, "UIGraphics.drawCircle.y");
    assertValidNonNegativeNumber(radius, "UIGraphics.drawCircle.radius");
    const box = { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2 };
    return this.addShape(box, style, (context) => {
      context.arc(x, y, radius, 0, Math.PI * 2);
    });
  }

  /**
   * Draws an arc of a circle. A fill covers the part cut off by the chord between its ends.
   * Gradients are laid over the bounds of the whole circle.
   *
   * @param startAngle - Start angle in radians, clockwise from the right
   * @param endAngle - End angle in radians, clockwise from the right
   */
  public drawArc(
    x: number,
    y: number,
    radius: number,
    startAngle: number,
    endAngle: number,
    style: UIGraphicsStyle,
  ): this {
    assertValidNumber(x, "UIGraphics.drawArc.x");
    assertValidNumber(y, "UIGraphics.drawArc.y");
    assertValidNonNegativeNumber(radius, "UIGraphics.drawArc.radius");
    assertValidNumber(startAngle, "UIGraphics.drawArc.startAngle");
    assertValidNumber(endAngle, "UIGraphics.drawArc.endAngle");
    const box = { x: x - radius, y: y - radius, width: radius * 2, height: radius * 2 };
    return this.addShape(box, style, (context) => {
      context.arc(x, y, radius, startAngle, endAngle);
    });
  }

  /**
   * Draws a closed polygon. Needs at least three points.
   *
   * @param points - Corners in order
   */
  public drawPolygon(points: readonly Vector2Like[], style: UIGraphicsStyle): this {
    if (points.length < 3) {
      return this;
    }
    const corners = points.map((point) => ({ x: point.x, y: point.y }));
    return this.addShape(boundPoints(corners), style, (context) => {
      context.moveTo(corners[0].x, corners[0].y);
      for (let i = 1; i < corners.length; i++) {
        context.lineTo(corners[i].x, corners[i].y);
      }
      context.closePath();
    });
  }

  /**
   * Draws connected line segments. Needs at least two points.
   *
   * @param points - Points in order
   */
  public drawPolyline(points: readonly Vector2Like[], stroke: UIGraphicsStrokeConfig): this {
    if (points.length < 2) {
      return this;
    }
    const vertices = points.map((point) => ({ x: point.x, y: point.y }));
    return this.addShape(boundPoints(vertices), { stroke }, (context) => {
      context.moveTo(vertices[0].x, vertices[0].y);
      for (let i = 1; i < vertices.length; i++) {
        context.lineTo(vertices[i].x, vertices[i].y);
      }
    });
  }

  /** Frees resources of the graphics */
  protected override destroyInternal(): void {
    this.surface.dispose();
    super.destroyInternal();
  }

  protected override onWillRender(renderer: WebGLRenderer, deltaTime: number): void {
    const layoutChanged = this.consumeLayoutChange();
    const pixelDensity = this.layer.pixelDensity;

    if (this.shapesDirty || layoutChanged || pixelDensity !== this.rasterPixelDensity) {
      this.rasterPixelDensity = pixelDensity;
      const rasterScale = calculateRasterScale(
        this.drawingWidth,
        this.drawingHeight,
        pixelDensity * Math.max(this.width / this.drawingWidth, this.height / this.drawingHeight),
      );
      if (this.shapesDirty || rasterScale !== this.rasterScale) {
        this.rasterScale = rasterScale;
        this.shapesDirty = false;
        this.draw();
      }
    }

    if (this.colorInternal.dirty) {
      this.sceneWrapper.setProperties(this.planeHandler, { color: this.colorInternal });
      this.colorInternal.setDirtyFalse();
    }

    super.onWillRender(renderer, deltaTime);
  }

  private addShape(
    box: UIPaintBox,
    style: UIGraphicsStyle,
    buildPath: (context: CanvasPath) => void,
  ): this {
    const { fill, stroke } = style;
    if (stroke !== undefined) {
      assertValidNonNegativeNumber(stroke.width, "UIGraphics.style.stroke.width");
    }
    if (fill === undefined && stroke === undefined) {
      return this;
    }

    this.shapes.push({
      buildPath,
      box,
      fill: fill === undefined ? undefined : resolvePaint(fill),
      stroke:
        stroke === undefined
          ? undefined
          : {
              paint: resolvePaint(stroke.paint),
              width: stroke.width,
              join: stroke.join ?? GRAPHICS_DEFAULT_STROKE_JOIN,
              cap: stroke.cap ?? GRAPHICS_DEFAULT_STROKE_CAP,
            },
    });
    this.shapesDirty = true;
    return this;
  }

  /** Draws the kept shapes at the current raster scale */
  private draw(): void {
    const textureReplaced = this.surface.begin(
      this.drawingWidth,
      this.drawingHeight,
      this.rasterScale,
    );
    const context = this.surface.context;

    for (const shape of this.shapes) {
      context.beginPath();
      shape.buildPath(context);

      if (shape.fill !== undefined) {
        context.fillStyle = toCanvasPaint(context, shape.fill, shape.box);
        context.fill();
      }

      if (shape.stroke !== undefined && shape.stroke.width > 0) {
        const halfWidth = shape.stroke.width / 2;
        const strokeBox = {
          x: shape.box.x - halfWidth,
          y: shape.box.y - halfWidth,
          width: shape.box.width + shape.stroke.width,
          height: shape.box.height + shape.stroke.width,
        };
        context.strokeStyle = toCanvasPaint(context, shape.stroke.paint, strokeBox);
        context.lineWidth = shape.stroke.width;
        context.lineJoin = shape.stroke.join;
        context.lineCap = shape.stroke.cap;
        context.stroke();
      }
    }

    if (textureReplaced) {
      this.sceneWrapper.setProperties(this.planeHandler, { texture: this.surface.texture });
    }
  }
}

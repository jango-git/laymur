import type { UILayer } from "../../layers/UILayer/UILayer.js";
import { assertValidNonNegativeNumber, assertValidNumber } from "../../miscellaneous/asserts.js";
import type { UICanvasRenderingContext2D } from "../../miscellaneous/canvas.js";
import type { Vector2Like } from "../../miscellaneous/math.js";
import type { UIPaintBox, UIPaintConfig } from "../../miscellaneous/paint/UIPaint.Internal.js";
import { resolvePaint, toCanvasPaint } from "../../miscellaneous/paint/UIPaint.js";
import { UICanvasElement } from "../UICanvasElement/UICanvasElement.js";
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
 * Copies points, so later changes of the given objects do not change the shape.
 * @param points Points to copy
 * @param subject Name of the method, used in errors
 * @returns Copied points
 */
function copyPoints(points: readonly Vector2Like[], subject: string): Vector2Like[] {
  return points.map((point) => {
    assertValidNumber(point.x, `${subject}.points.x`);
    assertValidNumber(point.y, `${subject}.points.y`);
    return { x: point.x, y: point.y };
  });
}

/**
 * Adds lines through points to the current path, from the first point on.
 * @param context Path to add to
 * @param points Points in order, at least one
 */
function tracePoints(context: CanvasPath, points: readonly Vector2Like[]): void {
  context.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    context.lineTo(points[i].x, points[i].y);
  }
}

/**
 * 2D vector drawing element. Shapes are drawn in a drawing box as large as the width and height
 * the element is created with, from its top left corner with y pointing down, and the box is
 * stretched over the element. The shapes are kept until `clear`.
 */
export class UIGraphics extends UICanvasElement {
  /** Width of the drawing box */
  protected readonly contentWidth: number;
  /** Height of the drawing box */
  protected readonly contentHeight: number;

  private readonly shapes: UIGraphicsShape[] = [];
  private shapesDirty = true;

  /**
   * Creates a new UIGraphics instance.
   *
   * @param layer - Layer containing this element
   * @param options - Configuration options. The width and height also set the drawing box.
   */
  constructor(layer: UILayer, options?: Partial<UIGraphicsOptions>) {
    super(layer, "UIGraphics.constructor", options);
    this.contentWidth = options?.width ?? GRAPHICS_DEFAULT_WIDTH;
    this.contentHeight = options?.height ?? GRAPHICS_DEFAULT_HEIGHT;
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
      this.drawRect(0, 0, this.contentWidth, this.contentHeight, { fill });
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
    const corners = copyPoints(points, "UIGraphics.drawPolygon");
    return this.addShape(boundPoints(corners), style, (context) => {
      tracePoints(context, corners);
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
    const vertices = copyPoints(points, "UIGraphics.drawPolyline");
    return this.addShape(boundPoints(vertices), { stroke }, (context) => {
      tracePoints(context, vertices);
    });
  }

  protected override updateContent(): boolean {
    const changed = this.shapesDirty;
    this.shapesDirty = false;
    return changed;
  }

  protected override drawContent(context: UICanvasRenderingContext2D): void {
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
}

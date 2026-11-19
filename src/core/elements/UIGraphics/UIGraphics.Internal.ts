import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal.js";
import type {
  UILineCap,
  UILineJoin,
  UIPaint,
  UIPaintBox,
  UIPaintConfig,
} from "../../miscellaneous/paint/UIPaint.Internal.js";
import type { UIElementOptions } from "../UIElement/UIElement.Internal.js";

/** Configuration options for UIGraphics */
export interface UIGraphicsOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
}

/** Line along the outline of a shape, centered on it */
export interface UIGraphicsStrokeConfig {
  /** Color or gradient of the line */
  paint: UIPaintConfig;
  /** Line width in drawing units */
  width: number;
  /** How the corners are joined. Miter by default. */
  join?: UILineJoin;
  /** How the open ends look. Butt by default. */
  cap?: UILineCap;
}

/** How a shape is painted. A shape without a fill and a stroke is not drawn. */
export interface UIGraphicsStyle {
  /** Color or gradient inside the shape */
  fill?: UIPaintConfig;
  /** Line along the outline of the shape */
  stroke?: UIGraphicsStrokeConfig;
}

/** Shape as kept until the graphics is cleared */
export interface UIGraphicsShape {
  /** Builds the path of the shape on a context */
  buildPath: (context: CanvasPath) => void;
  /**
   * Bounds of the path. A fill gradient is laid over them, a stroke gradient over them widened
   * by half the stroke on each side.
   */
  box: UIPaintBox;
  /** Fill, if any */
  fill?: UIPaint;
  /** Stroke, if any */
  stroke?: {
    paint: UIPaint;
    width: number;
    join: UILineJoin;
    cap: UILineCap;
  };
}

/** Corner radius of a rounded rectangle, one for all corners or four from the top left clockwise */
export type UIGraphicsCornerRadius = number | readonly [number, number, number, number];

export const GRAPHICS_DEFAULT_WIDTH = 2;
export const GRAPHICS_DEFAULT_HEIGHT = 2;
export const GRAPHICS_DEFAULT_STROKE_JOIN = "miter" as const;
export const GRAPHICS_DEFAULT_STROKE_CAP = "butt" as const;

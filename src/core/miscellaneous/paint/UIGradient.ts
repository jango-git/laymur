import { assertValidUnitNumber } from "../asserts.js";
import type { UICanvasRenderingContext2D } from "../canvas.js";
import { toCanvasColor } from "../color/canvasColor.js";
import type { UIGradientStop } from "./UIGradient.Internal.js";
import type { UIPaintBox } from "./UIPaint.Internal.js";

/**
 * Base class for gradients that fill text, its strokes and the shapes of `UIGraphics`. A gradient
 * is laid over the box of what it fills, so its geometry is given in fractions of that box, from
 * the top left corner, y pointing down. A gradient does not change after it is created.
 */
export abstract class UIGradient {
  private readonly stops: readonly { offset: number; color: string }[];

  /**
   * @param stops Color stops, at least one. Their order does not matter.
   * @throws If there are no stops or an offset is outside 0 to 1
   */
  constructor(stops: readonly UIGradientStop[]) {
    if (stops.length === 0) {
      throw new Error("UIGradient.constructor.stops: at least one stop is required");
    }
    for (const stop of stops) {
      assertValidUnitNumber(stop.offset, "UIGradient.constructor.stops.offset");
    }
    this.stops = stops
      .map((stop) => ({ offset: stop.offset, color: toCanvasColor(stop.color) }))
      .sort((a, b) => a.offset - b.offset);
  }

  /**
   * Builds the canvas gradient over a box given in the current canvas coordinates.
   * @internal
   */
  public createCanvasGradient(
    context: UICanvasRenderingContext2D,
    box: UIPaintBox,
  ): CanvasGradient {
    const gradient = this.createCanvasGeometry(context, box);
    for (const stop of this.stops) {
      gradient.addColorStop(stop.offset, stop.color);
    }
    return gradient;
  }

  /** Creates the canvas gradient of this geometry over the box, without stops */
  protected abstract createCanvasGeometry(
    context: UICanvasRenderingContext2D,
    box: UIPaintBox,
  ): CanvasGradient;
}

import type { UICanvasRenderingContext2D } from "../canvas.js";
import { toCanvasColor } from "../color/canvasColor.js";
import { UIGradient } from "./UIGradient.js";
import type { UIPaint, UIPaintBox, UIPaintConfig } from "./UIPaint.Internal.js";

/**
 * Converts a paint config to the stored paint. Colors become CSS strings, so a `UIColor` changed
 * later does not change the paint.
 * @param paint Paint to convert
 * @returns CSS color string or the gradient itself
 */
export function resolvePaint(paint: UIPaintConfig): UIPaint {
  return paint instanceof UIGradient ? paint : toCanvasColor(paint);
}

/**
 * Builds the canvas fill or stroke style of a paint.
 * @param context Canvas context the style is used on
 * @param paint Stored paint
 * @param box Box a gradient is laid over, in the current canvas coordinates
 * @returns Value for `fillStyle` or `strokeStyle`
 */
export function toCanvasPaint(
  context: UICanvasRenderingContext2D,
  paint: UIPaint,
  box: UIPaintBox,
): string | CanvasGradient {
  return typeof paint === "string" ? paint : paint.createCanvasGradient(context, box);
}

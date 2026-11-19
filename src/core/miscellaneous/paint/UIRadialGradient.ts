import { assertValidNonNegativeNumber, assertValidNumber } from "../asserts.js";
import type { UICanvasRenderingContext2D } from "../canvas.js";
import type { UIGradientStop, UIRadialGradientOptions } from "./UIGradient.Internal.js";
import { RADIAL_GRADIENT_DEFAULT_OPTIONS } from "./UIGradient.Internal.js";
import { UIGradient } from "./UIGradient.js";
import type { UIPaintBox } from "./UIPaint.Internal.js";

/**
 * Circular gradient between two radii around a center, by default from the center to the ends of
 * the longer axis of the box. The circle stays round in a box that is not square.
 */
export class UIRadialGradient extends UIGradient {
  private readonly options: UIRadialGradientOptions;

  /**
   * @param stops Color stops, at least one
   * @param options Center in fractions of the filled box, radii in fractions of its longer side
   * @throws If the outer radius is not larger than the inner one
   */
  constructor(stops: readonly UIGradientStop[], options: Partial<UIRadialGradientOptions> = {}) {
    super(stops);
    this.options = { ...RADIAL_GRADIENT_DEFAULT_OPTIONS, ...options };
    const { centerX, centerY, innerRadius, outerRadius } = this.options;
    assertValidNumber(centerX, "UIRadialGradient.constructor.options.centerX");
    assertValidNumber(centerY, "UIRadialGradient.constructor.options.centerY");
    assertValidNonNegativeNumber(innerRadius, "UIRadialGradient.constructor.options.innerRadius");
    assertValidNonNegativeNumber(outerRadius, "UIRadialGradient.constructor.options.outerRadius");
    if (outerRadius <= innerRadius) {
      throw new Error(
        "UIRadialGradient.constructor.options.outerRadius: must be larger than innerRadius",
      );
    }
  }

  protected override createCanvasGeometry(
    context: UICanvasRenderingContext2D,
    box: UIPaintBox,
  ): CanvasGradient {
    const { centerX, centerY, innerRadius, outerRadius } = this.options;
    const x = box.x + centerX * box.width;
    const y = box.y + centerY * box.height;
    const side = Math.max(box.width, box.height);
    return context.createRadialGradient(x, y, innerRadius * side, x, y, outerRadius * side);
  }
}

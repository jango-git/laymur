import { assertValidNumber } from "../asserts.js";
import type { UICanvasRenderingContext2D } from "../canvas.js";
import type { UIGradientStop, UILinearGradientOptions } from "./UIGradient.Internal.js";
import { LINEAR_GRADIENT_DEFAULT_OPTIONS } from "./UIGradient.Internal.js";
import { UIGradient } from "./UIGradient.js";
import type { UIPaintBox } from "./UIPaint.Internal.js";

/** Gradient along a line from a start point to an end point, top to bottom by default */
export class UILinearGradient extends UIGradient {
  private readonly options: UILinearGradientOptions;

  /**
   * @param stops Color stops, at least one
   * @param options Start and end in fractions of the filled box
   */
  constructor(stops: readonly UIGradientStop[], options: Partial<UILinearGradientOptions> = {}) {
    super(stops);
    this.options = { ...LINEAR_GRADIENT_DEFAULT_OPTIONS, ...options };
    assertValidNumber(this.options.startX, "UILinearGradient.constructor.options.startX");
    assertValidNumber(this.options.startY, "UILinearGradient.constructor.options.startY");
    assertValidNumber(this.options.endX, "UILinearGradient.constructor.options.endX");
    assertValidNumber(this.options.endY, "UILinearGradient.constructor.options.endY");
  }

  protected override createCanvasGeometry(
    context: UICanvasRenderingContext2D,
    box: UIPaintBox,
  ): CanvasGradient {
    const { startX, startY, endX, endY } = this.options;
    return context.createLinearGradient(
      box.x + startX * box.width,
      box.y + startY * box.height,
      box.x + endX * box.width,
      box.y + endY * box.height,
    );
  }
}

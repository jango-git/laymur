import { assertValidNonNegativeNumber, assertValidNumber } from "../asserts";
import { UIArea } from "./UIArea";

/** Circular interaction area */
export class UIAreaCircle extends UIArea {
  /**
   * Creates circular area.
   *
   * @param centerX - Center X in normalized coordinates (0 to 1)
   * @param centerY - Center Y in normalized coordinates (0 to 1)
   * @param radius - Radius in normalized coordinates (0 to 1)
   */
  constructor(
    public centerX: number,
    public centerY: number,
    public radius: number,
  ) {
    super();
    assertValidNonNegativeNumber(centerX, "UIAreaCircle.constructor.centerX");
    assertValidNonNegativeNumber(centerY, "UIAreaCircle.constructor.centerY");
    assertValidNonNegativeNumber(radius, "UIAreaCircle.constructor.radius");
  }

  /** @internal */
  public contains(pointX: number, pointY: number): boolean {
    assertValidNumber(pointX, "UIAreaCircle.contains.pointX");
    assertValidNumber(pointY, "UIAreaCircle.contains.pointY");
    const deltaX = pointX - this.centerX;
    const deltaY = pointY - this.centerY;
    return deltaX * deltaX + deltaY * deltaY <= this.radius * this.radius;
  }
}

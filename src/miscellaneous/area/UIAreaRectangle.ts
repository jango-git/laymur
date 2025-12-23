import { assertValidNonNegativeNumber, assertValidNumber } from "../asserts";
import { UIArea } from "./UIArea";

/** Rectangular interaction area */
export class UIAreaRectangle extends UIArea {
  /**
   * Creates rectangular area.
   *
   * @param x - X position in normalized coordinates (0 to 1)
   * @param y - Y position in normalized coordinates (0 to 1)
   * @param width - Width in normalized coordinates (0 to 1)
   * @param height - Height in normalized coordinates (0 to 1)
   */
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {
    super();
    assertValidNonNegativeNumber(x, "UIAreaRectangle.constructor.x");
    assertValidNonNegativeNumber(y, "UIAreaRectangle.constructor.y");
    assertValidNonNegativeNumber(width, "UIAreaRectangle.constructor.width");
    assertValidNonNegativeNumber(height, "UIAreaRectangle.constructor.height");
  }

  /** @internal */
  public contains(pointX: number, pointY: number): boolean {
    assertValidNumber(pointX, "UIAreaRectangle.contains.pointX");
    assertValidNumber(pointY, "UIAreaRectangle.contains.pointY");
    return (
      pointX >= this.x &&
      pointX <= this.x + this.width &&
      pointY >= this.y &&
      pointY <= this.y + this.height
    );
  }
}

import { assertValidNonNegativeNumber, assertValidNumber } from "../asserts";
import { UIArea } from "./UIArea";

/** Rectangular interaction area with rounded corners */
export class UIAreaRoundedRectangle extends UIArea {
  /**
   * Creates rounded rectangular area.
   *
   * Radius clamped to half of smallest dimension.
   *
   * @param x - X position in normalized coordinates (0 to 1)
   * @param y - Y position in normalized coordinates (0 to 1)
   * @param width - Width in normalized coordinates (0 to 1)
   * @param height - Height in normalized coordinates (0 to 1)
   * @param radius - Corner radius in normalized coordinates (0 to 1)
   */
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public radius: number,
  ) {
    super();
    assertValidNonNegativeNumber(x, "UIAreaRoundedRectangle.constructor.x");
    assertValidNonNegativeNumber(y, "UIAreaRoundedRectangle.constructor.y");
    assertValidNonNegativeNumber(
      width,
      "UIAreaRoundedRectangle.constructor.width",
    );
    assertValidNonNegativeNumber(
      height,
      "UIAreaRoundedRectangle.constructor.height",
    );
    assertValidNonNegativeNumber(
      radius,
      "UIAreaRoundedRectangle.constructor.radius",
    );
    this.radius = Math.min(radius, Math.min(width, height) / 2);
  }

  /** @internal */
  public contains(pointX: number, pointY: number): boolean {
    assertValidNumber(pointX, "UIAreaRoundedRectangle.contains.pointX");
    assertValidNumber(pointY, "UIAreaRoundedRectangle.contains.pointY");
    const left = this.x;
    const right = this.x + this.width;
    const top = this.y;
    const bottom = this.y + this.height;

    if (pointX < left || pointX > right || pointY < top || pointY > bottom) {
      return false;
    }

    const cornerLeft = left + this.radius;
    const cornerRight = right - this.radius;
    const cornerTop = top + this.radius;
    const cornerBottom = bottom - this.radius;

    if (pointX >= cornerLeft && pointX <= cornerRight) {
      return true;
    }

    if (pointY >= cornerTop && pointY <= cornerBottom) {
      return true;
    }

    let centerX: number;
    let centerY: number;

    if (pointX < cornerLeft) {
      centerX = cornerLeft;
    } else {
      centerX = cornerRight;
    }

    if (pointY < cornerTop) {
      centerY = cornerTop;
    } else {
      centerY = cornerBottom;
    }

    const deltaX = pointX - centerX;
    const deltaY = pointY - centerY;
    return deltaX * deltaX + deltaY * deltaY <= this.radius * this.radius;
  }
}

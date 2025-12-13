import { UIArea } from "./UIArea";

/**
 * Rectangular area with rounded corners.
 * Radius is clamped to half of the smallest dimension.
 */
export class UIAreaRoundedRectangle extends UIArea {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
    public radius: number,
  ) {
    super();
    this.radius = Math.min(radius, Math.min(width, height) / 2);
  }

  /** @internal */
  public contains(pointX: number, pointY: number): boolean {
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

import { UIArea } from "./UIArea";

/**
 * Circular area defined by center and radius.
 */
export class UIAreaCircle extends UIArea {
  constructor(
    public centerX: number,
    public centerY: number,
    public radius: number,
  ) {
    super();
  }

  /** @internal */
  public contains(pointX: number, pointY: number): boolean {
    const deltaX = pointX - this.centerX;
    const deltaY = pointY - this.centerY;
    return deltaX * deltaX + deltaY * deltaY <= this.radius * this.radius;
  }
}

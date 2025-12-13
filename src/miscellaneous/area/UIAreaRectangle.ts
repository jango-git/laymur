import { UIArea } from "./UIArea";

/**
 * Rectangular area defined by position and dimensions.
 */
export class UIAreaRectangle extends UIArea {
  constructor(
    public x: number,
    public y: number,
    public width: number,
    public height: number,
  ) {
    super();
  }

  /** @internal */
  public contains(pointX: number, pointY: number): boolean {
    return (
      pointX >= this.x &&
      pointX <= this.x + this.width &&
      pointY >= this.y &&
      pointY <= this.y + this.height
    );
  }
}

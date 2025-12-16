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

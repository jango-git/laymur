/**
 * Base class for area definitions.
 * Determines whether a point lies within a defined region.
 */
export abstract class UIArea {
  /**
   * Checks if a point is inside the area.
   * @internal
   */
  public abstract contains(pointX: number, pointY: number): boolean;
}

/**
 * Base class for interaction area shapes. Subclass it for a custom hit shape and assign it to
 * `UIDummy.interactionArea`.
 */
export abstract class UIArea {
  /**
   * Whether a point hits the area.
   * @param pointX X in element-local normalized space (0 = left edge, 1 = right edge)
   * @param pointY Y in element-local normalized space (0 = bottom edge, 1 = top edge)
   */
  public abstract contains(pointX: number, pointY: number): boolean;
}

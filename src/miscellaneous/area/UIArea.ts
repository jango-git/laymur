/** Base class for interaction area shapes */
export abstract class UIArea {
  /** @internal */
  public abstract contains(pointX: number, pointY: number): boolean;
}

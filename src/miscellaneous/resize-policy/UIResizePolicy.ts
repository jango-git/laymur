/** Base class for viewport resize policies */
export abstract class UIResizePolicy {
  /** @internal */
  public dirty = false;

  /** @internal */
  public abstract calculateScale(width: number, height: number): number;
}

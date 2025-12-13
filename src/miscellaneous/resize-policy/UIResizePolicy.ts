/**
 * Base class for resize policies.
 * Calculates scale factors based on viewport dimensions.
 */
export abstract class UIResizePolicy {
  /**
   * Indicates whether the policy has been modified.
   * Must be reset to `false` externally by the owner.
   * @internal
   */
  public dirty = false;

  /**
   * Calculates scale factor for given dimensions.
   * @internal
   */
  public abstract calculateScale(width: number, height: number): number;
}

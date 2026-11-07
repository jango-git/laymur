/**
 * Base class for viewport resize policies. Subclass it for a custom scaling rule and pass it to
 * `UIFullscreenLayer`.
 */
export abstract class UIResizePolicy {
  /**
   * Set it to true when a parameter of the policy changes; the layer then resizes on its next
   * render and resets the flag.
   */
  public dirty = false;

  /**
   * Scale from screen pixels to world units: the layer is the viewport size times this value.
   * @param width Viewport width in pixels
   * @param height Viewport height in pixels
   * @returns World units per pixel
   */
  public abstract calculateScale(width: number, height: number): number;
}

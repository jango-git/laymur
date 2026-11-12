/**
 * Base class for viewport resize policies. Subclass it for a custom scaling rule and pass it to
 * `UIViewportLayer`.
 */
export abstract class UIResizePolicy {
  private versionInternal = 0;

  /**
   * Bumped when a parameter of the policy changes; every layer using the policy resizes on its
   * next render. One policy may serve several layers.
   */
  public get version(): number {
    return this.versionInternal;
  }

  /** Call it when a parameter of the policy changes */
  protected markChanged(): void {
    this.versionInternal++;
  }

  /**
   * Scale from screen pixels to world units: the layer is the viewport size times this value.
   * @param width Viewport width in pixels
   * @param height Viewport height in pixels
   * @returns World units per pixel
   */
  public abstract calculateScale(width: number, height: number): number;
}

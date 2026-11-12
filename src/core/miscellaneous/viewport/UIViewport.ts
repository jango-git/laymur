import type { FerrsignView0 } from "ferrsign";
import { Ferrsign0 } from "ferrsign";

/**
 * Part of the page a layer covers: gives the layer its size and the origin of input positions.
 * Sizes and positions are in CSS pixels. Subclass it for a custom area and pass it to
 * `UIViewportLayer`.
 *
 * A viewport passed to a layer belongs to the caller, who destroys it after the layers using it;
 * one viewport may serve several layers.
 */
export abstract class UIViewport {
  protected readonly signalResizedInternal = new Ferrsign0();
  private destroyedInternal = false;

  /** Signal fired when the size changes */
  public get signalResized(): FerrsignView0 {
    return this.signalResizedInternal;
  }

  /** Whether the viewport is destroyed */
  public get destroyed(): boolean {
    return this.destroyedInternal;
  }

  /** Width in CSS pixels; 0 while the area is not laid out */
  public abstract get width(): number;

  /** Height in CSS pixels; 0 while the area is not laid out */
  public abstract get height(): number;

  /** Stops tracking the size. Does nothing if the viewport is already destroyed. */
  public destroy(): void {
    if (this.destroyedInternal) {
      return;
    }
    this.destroyedInternal = true;
    this.destroyInternal();
  }

  /**
   * Converts a position on the page to the viewport: origin at the bottom-left corner, y up.
   * @param clientX Horizontal position relative to the browser viewport, as in `PointerEvent`
   * @param clientY Vertical position relative to the browser viewport, as in `PointerEvent`
   * @param result Vector to write into
   * @returns The result vector
   */
  public abstract toLocal<T extends { x: number; y: number }>(
    clientX: number,
    clientY: number,
    result: T,
  ): T;

  /** Releases what the viewport listens to */
  protected abstract destroyInternal(): void;
}

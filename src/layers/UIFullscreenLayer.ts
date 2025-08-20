import type { WebGLRenderer } from "three";
import {
  assertValidNumber,
  assertValidPositiveNumber,
} from "../miscellaneous/asserts";
import { UIOrientation } from "../miscellaneous/UIOrientation";
import { UILayer } from "./UILayer";

/**
 * UI layer that manages fullscreen interfaces with optional fixed dimensions and automatic scaling.
 *
 * UIFullscreenLayer extends UILayer to provide automatic browser window integration,
 * handling window resize events and pointer interactions. It supports optional fixed
 * width or height constraints that enable responsive scaling while maintaining
 * design proportions across different screen sizes.
 *
 * The layer automatically calculates scaling factors based on the orientation and
 * fixed dimension constraints, ensuring consistent layout appearance regardless
 * of the actual browser window size.
 *
 * @see {@link UILayer} - Base layer functionality
 * @see {@link UIOrientation} - Orientation-based scaling behavior
 */
export class UIFullscreenLayer extends UILayer {
  /** Internal storage for the optional fixed width constraint. */
  private fixedWidthInternal?: number;
  /** Internal storage for the optional fixed height constraint. */
  private fixedHeightInternal?: number;

  /**
   * Creates a new UIFullscreenLayer instance with optional fixed dimensions.
   *
   * The layer will automatically resize to match the browser window and set up
   * event listeners for window resize and pointer events. Fixed dimensions
   * enable proportional scaling while maintaining design aspect ratios.
   *
   * @param fixedWidth - Optional fixed width for proportional scaling
   * @param fixedHeight - Optional fixed height for proportional scaling
   * @throws Will throw an error if fixed dimensions are not valid positive numbers
   * @see {@link assertValidPositiveNumber}
   */
  constructor(fixedWidth: number | undefined, fixedHeight: number | undefined) {
    if (fixedWidth !== undefined) {
      assertValidPositiveNumber(fixedWidth, "UIFullscreenLayer.fixedWidth");
    }
    if (fixedHeight !== undefined) {
      assertValidPositiveNumber(fixedHeight, "UIFullscreenLayer.fixedHeight");
    }

    super(window.innerWidth, window.innerHeight);
    this.fixedWidthInternal = fixedWidth;
    this.fixedHeightInternal = fixedHeight;
    window.addEventListener("resize", this.onResize);
    window.addEventListener("pointerdown", this.onClick);
    this.onResize();
  }

  /**
   * Gets the current fixed width constraint.
   * @returns The fixed width in pixels, or undefined if not set
   */
  public get fixedWidth(): number | undefined {
    return this.fixedWidthInternal;
  }

  /**
   * Gets the current fixed height constraint.
   * @returns The fixed height in pixels, or undefined if not set
   */
  public get fixedHeight(): number | undefined {
    return this.fixedHeightInternal;
  }

  /**
   * Sets a new fixed width constraint and triggers resize recalculation.
   * @param value - The new fixed width in pixels, or undefined to remove constraint
   * @throws Will throw an error if value is not a valid positive number
   * @see {@link assertValidPositiveNumber}
   */
  public set fixedWidth(value: number | undefined) {
    if (value !== undefined) {
      assertValidPositiveNumber(value, "UIFullscreenLayer.fixedWidth");
    }

    if (value !== this.fixedWidthInternal) {
      this.fixedWidthInternal = value;
      this.onResize();
    }
  }

  /**
   * Sets a new fixed height constraint and triggers resize recalculation.
   * @param value - The new fixed height in pixels, or undefined to remove constraint
   * @throws Will throw an error if value is not a valid positive number
   * @see {@link assertValidPositiveNumber}
   */
  public set fixedHeight(value: number | undefined) {
    if (value !== undefined) {
      assertValidPositiveNumber(value, "UIFullscreenLayer.fixedHeight");
    }

    if (value !== this.fixedHeightInternal) {
      this.fixedHeightInternal = value;
      this.onResize();
    }
  }

  /**
   * Destroys the fullscreen layer by removing all event listeners.
   *
   * This method cleans up window event listeners for resize and pointer events.
   * After calling this method, the layer will no longer respond to window
   * changes and should not be used anymore.
   */
  public destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onClick);
  }

  /**
   * Renders the fullscreen layer and all its contained elements.
   *
   * Clears the depth and stencil buffers and delegates rendering to the
   * parent layer's render method. This ensures proper rendering order
   * and buffer management for fullscreen interfaces.
   *
   * @param renderer - The WebGL renderer instance
   * @param deltaTime - Time elapsed since the last frame in seconds
   * @throws Will throw an error if deltaTime is not a valid number
   * @see {@link assertValidNumber}
   */
  public render(renderer: WebGLRenderer, deltaTime: number): void {
    assertValidNumber(deltaTime, "UIFullscreenLayer.deltaTime");
    super.renderInternal(renderer, deltaTime);
  }

  /**
   * Calculates the scaling factor based on orientation and fixed dimensions.
   *
   * The scaling factor is determined by the current orientation and which
   * fixed dimension constraint is active. In horizontal orientation, fixed
   * width takes precedence; in vertical orientation, fixed height takes precedence.
   *
   * @returns The scaling factor to apply to window dimensions
   * @private
   */
  private calculateScale(): number {
    if (this.orientation === UIOrientation.HORIZONTAL) {
      if (this.fixedWidth !== undefined) {
        return this.fixedWidth / window.innerWidth;
      } else if (this.fixedHeight !== undefined) {
        return this.fixedHeight / window.innerHeight;
      } else {
        return 1;
      }
    } else {
      if (this.fixedHeight !== undefined) {
        return this.fixedHeight / window.innerHeight;
      } else if (this.fixedWidth !== undefined) {
        return this.fixedWidth / window.innerWidth;
      } else {
        return 1;
      }
    }
  }

  /**
   * Event handler for window resize events.
   *
   * Recalculates the scaling factor and updates the layer dimensions
   * based on the new window size and fixed dimension constraints.
   *
   * @private
   */
  private readonly onResize = (): void => {
    const scale = this.calculateScale();
    this.resizeInternal(window.innerWidth * scale, window.innerHeight * scale);
  };

  /**
   * Event handler for pointer down events.
   *
   * Converts browser pointer coordinates to layer coordinates by accounting
   * for element positioning and applying the appropriate scaling factor.
   * The y-coordinate is flipped to match the UI coordinate system.
   *
   * @param event - The pointer event from the browser
   * @private
   */
  private readonly onClick = (event: PointerEvent): void => {
    const r =
      event.target instanceof HTMLElement
        ? event.target.getBoundingClientRect()
        : null;

    const x = r ? event.clientX - r.left : event.clientX;
    const y = r ? r.bottom - event.clientY : window.innerHeight - event.clientY;

    const scale = this.calculateScale();
    this.clickInternal(x * scale, y * scale);
  };
}

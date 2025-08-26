import type { WebGLRenderer } from "three";
import {
  assertValidNumber,
  assertValidPositiveNumber,
} from "../miscellaneous/asserts";
import { UIOrientation } from "../miscellaneous/UIOrientation";
import { UILayer } from "./UILayer";

/**
 * UI layer that manages fullscreen interfaces with optional fixed dimensions.
 *
 * Extends UILayer to provide browser window integration, handling resize events
 * and pointer interactions. Supports optional fixed width or height constraints
 * for responsive scaling while maintaining design proportions.
 *
 * @public
 */
export class UIFullscreenLayer extends UILayer {
  /** Optional fixed width constraint. */
  private fixedWidthInternal?: number;
  /** Optional fixed height constraint. */
  private fixedHeightInternal?: number;

  /**
   * Creates a new UIFullscreenLayer instance with optional fixed dimensions.
   * Sets up event listeners for window resize and pointer events.
   *
   * @param fixedWidth - Optional fixed width for proportional scaling
   * @param fixedHeight - Optional fixed height for proportional scaling
   *
   * @throws Error if fixed dimensions are not valid positive numbers
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
   *
   * @returns The fixed width in pixels, or undefined if not set
   */
  public get fixedWidth(): number | undefined {
    return this.fixedWidthInternal;
  }

  /**
   * Gets the current fixed height constraint.
   *
   * @returns The fixed height in pixels, or undefined if not set
   */
  public get fixedHeight(): number | undefined {
    return this.fixedHeightInternal;
  }

  /**
   * Sets a new fixed width constraint and triggers resize recalculation.
   *
   * @param value - The new fixed width in pixels, or undefined to remove constraint
   *
   * @throws Error if value is not a valid positive number
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
   *
   * @param value - The new fixed height in pixels, or undefined to remove constraint
   *
   * @throws Error if value is not a valid positive number
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
   * After calling this method, the layer should not be used anymore.
   */
  public destroy(): void {
    window.removeEventListener("resize", this.onResize);
    window.removeEventListener("pointerdown", this.onClick);
  }

  /**
   * Renders the fullscreen layer and all its contained elements.
   *
   * @param renderer - The WebGL renderer instance
   * @param deltaTime - Time elapsed since the last frame in seconds
   *
   * @throws Error if deltaTime is not a valid number
   */
  public render(renderer: WebGLRenderer, deltaTime: number): void {
    assertValidNumber(deltaTime, "UIFullscreenLayer.deltaTime");
    super.renderInternal(renderer, deltaTime);
  }

  /**
   * Calculates the scaling factor based on orientation and fixed dimensions.
   * In horizontal orientation, fixed width takes precedence; in vertical
   * orientation, fixed height takes precedence.
   *
   * @returns The scaling factor to apply to window dimensions
   *
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
   * Recalculates scaling factor and updates layer dimensions.
   */
  private readonly onResize = (): void => {
    const scale = this.calculateScale();
    this.resizeInternal(window.innerWidth * scale, window.innerHeight * scale);
  };

  /**
   * Event handler for pointer down events.
   * Converts browser coordinates to layer coordinates and applies scaling.
   * The y-coordinate is flipped to match the UI coordinate system.
   *
   * @param event - The pointer event from the browser
   *
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
    this.pointerClickInternal(x * scale, y * scale);
  };
}

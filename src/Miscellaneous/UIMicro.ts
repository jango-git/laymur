import { MathUtils } from "three";
import type { UIElement } from "../Elements/UIElement";

/**
 * Default position offset value (0)
 */
const DEFAULT_POSITION = 0;
/**
 * Default anchor point value (0.5 = centered)
 */
const DEFAULT_ANCHOR = 0.5;
/**
 * Default scale value (1 = no scaling)
 */
const DEFAULT_SCALE = 1;
/**
 * Default rotation value in radians (0 = no rotation)
 */
const DEFAULT_ROTATION = 0;

/**
 * Internal implementation of micro-transformations for UI elements.
 * Stores the raw transformation values and recalculation flag.
 *
 */
export class UIMicroInternal {
  /** X-axis offset from element position */
  public x = DEFAULT_POSITION;
  /** Y-axis offset from element position */
  public y = DEFAULT_POSITION;
  /** X-axis anchor point (0-1) where transformations are applied */
  public anchorX = DEFAULT_ANCHOR;
  /** Y-axis anchor point (0-1) where transformations are applied */
  public anchorY = DEFAULT_ANCHOR;
  /** X-axis scaling factor */
  public scaleX = DEFAULT_SCALE;
  /** Y-axis scaling factor */
  public scaleY = DEFAULT_SCALE;
  /** Rotation in radians */
  public rotation = DEFAULT_ROTATION;
  /** Flag indicating whether transformations need to be recalculated */
  public needsRecalculation = false;
}

/**
 * Provides fine-grained transformations for UI elements.
 *
 * Micro-transformations allow for detailed positioning, scaling, and rotation
 * adjustments relative to an element's base position and dimensions.
 * These transformations are applied on top of the standard element positioning
 * and can be used for effects like pivoting, offsetting, and animation.
 */
export class UIMicro {
  /**
   * Creates a new micro-transformation interface.
   *
   * @param raw - The internal state object that stores transformation values
   * @param owner - The UI element that owns these transformations
   */
  constructor(
    private readonly raw: UIMicroInternal,
    private readonly owner: UIElement,
  ) {}

  /**
   * Gets the X-axis offset from the element's position.
   */
  public get x(): number {
    return this.raw.x;
  }

  /**
   * Gets the Y-axis offset from the element's position.
   */
  public get y(): number {
    return this.raw.y;
  }

  /**
   * Gets the X-axis anchor point (0-1) where transformations are applied.
   *
   * - 0.0 = left edge
   * - 0.5 = center (default)
   * - 1.0 = right edge
   */
  public get anchorX(): number {
    return this.raw.anchorX;
  }

  /**
   * Gets the Y-axis anchor point (0-1) where transformations are applied.
   *
   * - 0.0 = top edge
   * - 0.5 = center (default)
   * - 1.0 = bottom edge
   */
  public get anchorY(): number {
    return this.raw.anchorY;
  }

  /**
   * Gets the X-axis scaling factor.
   *
   * - 1.0 = normal size (default)
   * - > 1.0 = enlarged
   * - < 1.0 = reduced
   */
  public get scaleX(): number {
    return this.raw.scaleX;
  }

  /**
   * Gets the Y-axis scaling factor.
   *
   * - 1.0 = normal size (default)
   * - > 1.0 = enlarged
   * - < 1.0 = reduced
   */
  public get scaleY(): number {
    return this.raw.scaleY;
  }

  /**
   * Gets the rotation in degrees.
   * Converted from the internal radians value.
   */
  public get angle(): number {
    return MathUtils.radToDeg(this.raw.rotation);
  }

  /**
   * Gets the rotation in radians.
   */
  public get rotation(): number {
    return this.raw.rotation;
  }

  /**
   * Sets the X-axis offset from the element's position.
   *
   * @param value - X offset in pixels
   */
  public set x(value: number) {
    if (value !== this.raw.x) {
      this.raw.x = value;
      this.raw.needsRecalculation = true;
    }
  }

  /**
   * Sets the Y-axis offset from the element's position.
   *
   * @param value - Y offset in pixels
   */
  public set y(value: number) {
    if (value !== this.raw.y) {
      this.raw.y = value;
      this.raw.needsRecalculation = true;
    }
  }

  /**
   * Sets the X-axis anchor point where transformations are applied.
   *
   * @param value - X anchor (0-1):
   *   - 0.0 = left edge
   *   - 0.5 = center (default)
   *   - 1.0 = right edge
   */
  public set anchorX(value: number) {
    if (value !== this.raw.anchorX) {
      this.raw.anchorX = value;
      this.raw.needsRecalculation = true;
    }
  }

  /**
   * Sets the Y-axis anchor point where transformations are applied.
   *
   * @param value - Y anchor (0-1):
   *   - 0.0 = top edge
   *   - 0.5 = center (default)
   *   - 1.0 = bottom edge
   */
  public set anchorY(value: number) {
    if (value !== this.raw.anchorY) {
      this.raw.anchorY = value;
      this.raw.needsRecalculation = true;
    }
  }

  /**
   * Sets the X-axis scaling factor.
   *
   * @param value - X scale factor:
   *   - 1.0 = normal size (default)
   *   - > 1.0 = enlarged
   *   - < 1.0 = reduced
   */
  public set scaleX(value: number) {
    if (value !== this.raw.scaleX) {
      this.raw.scaleX = value;
      this.raw.needsRecalculation = true;
    }
  }

  /**
   * Sets the Y-axis scaling factor.
   *
   * @param value - Y scale factor:
   *   - 1.0 = normal size (default)
   *   - > 1.0 = enlarged
   *   - < 1.0 = reduced
   */
  public set scaleY(value: number) {
    if (value !== this.raw.scaleY) {
      this.raw.scaleY = value;
      this.raw.needsRecalculation = true;
    }
  }

  /**
   * Sets the rotation in degrees.
   * Automatically converts to radians for internal storage.
   *
   * @param value - Rotation angle in degrees
   */
  public set angle(value: number) {
    const convertedValue = MathUtils.degToRad(value);
    if (convertedValue !== this.raw.rotation) {
      this.raw.rotation = convertedValue;
      this.raw.needsRecalculation = true;
    }
  }

  /**
   * Sets the rotation in radians.
   *
   * @param value - Rotation angle in radians
   */
  public set rotation(value: number) {
    if (value !== this.raw.rotation) {
      this.raw.rotation = value;
      this.raw.needsRecalculation = true;
    }
  }

  /**
   * Sets the anchor point based on global coordinates relative to the element.
   * Converts the global position to a normalized anchor point (0-1 range).
   *
   * This is useful for setting the pivot point to a specific position,
   * such as making an element rotate around a particular point.
   *
   * @param x - Global X coordinate to set as anchor
   * @param y - Global Y coordinate to set as anchor
   */
  public setAnchorByGlobalPosition(x: number, y: number): void {
    const deltaX = x - this.owner.x;
    const deltaY = y - this.owner.y;
    const newAnchorX = deltaX / this.owner.width;
    const newAnchorY = deltaY / this.owner.height;

    if (newAnchorX !== this.raw.anchorX || newAnchorY !== this.raw.anchorY) {
      this.raw.anchorX = newAnchorX;
      this.raw.anchorY = newAnchorY;
      this.raw.needsRecalculation = true;
    }
  }

  /**
   * Resets all micro-transformations to their default values.
   *
   * Default values:
   * - Position (x, y): 0
   * - Anchor (anchorX, anchorY): 0.5 (centered)
   * - Scale (scaleX, scaleY): 1.0 (original size)
   * - Rotation: 0 (no rotation)
   *
   * Only triggers recalculation if any values were changed.
   */
  public reset(): void {
    if (
      this.raw.x !== DEFAULT_POSITION ||
      this.raw.y !== DEFAULT_POSITION ||
      this.raw.anchorX !== DEFAULT_ANCHOR ||
      this.raw.anchorY !== DEFAULT_ANCHOR ||
      this.raw.scaleX !== DEFAULT_SCALE ||
      this.raw.scaleY !== DEFAULT_SCALE ||
      this.raw.rotation !== DEFAULT_ROTATION
    ) {
      this.raw.x = DEFAULT_POSITION;
      this.raw.y = DEFAULT_POSITION;
      this.raw.anchorX = DEFAULT_ANCHOR;
      this.raw.anchorY = DEFAULT_ANCHOR;
      this.raw.scaleX = DEFAULT_SCALE;
      this.raw.scaleY = DEFAULT_SCALE;
      this.raw.rotation = DEFAULT_ROTATION;
      this.raw.needsRecalculation = true;
    }
  }
}

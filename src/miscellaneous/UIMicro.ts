import { MathUtils } from "three";

/** Default position value for x and y coordinates. */
const DEFAULT_POSITION = 0;
/** Default anchor point value for anchorX and anchorY. */
const DEFAULT_ANCHOR = 0;
/** Default scale value for scaleX and scaleY. */
const DEFAULT_SCALE = 1;
/** Default rotation value in radians. */
const DEFAULT_ROTATION = 0;

/**
 * Micro-transformation system for non-constraint based UI element adjustments.
 *
 * UIMicro provides a lightweight transformation system that operates independently
 * of the constraint solver. It manages position offsets, anchor points, scaling,
 * and rotation transformations that can be applied to UI elements for animations,
 * visual effects, or fine-tuned positioning without affecting the constraint-based
 * layout system.
 *
 * All transformations are tracked with change detection to optimize rendering
 * performance by only recalculating when properties have actually changed.
 *
 * @see {@link UIElement} - Elements that use micro transformations
 */
export class UIMicro {
  /** Internal storage for x-coordinate offset. */
  private xInternal: number = DEFAULT_POSITION;
  /** Internal storage for y-coordinate offset. */
  private yInternal: number = DEFAULT_POSITION;
  /** Internal storage for x-axis anchor point. */
  private anchorXInternal: number = DEFAULT_ANCHOR;
  /** Internal storage for y-axis anchor point. */
  private anchorYInternal: number = DEFAULT_ANCHOR;
  /** Internal storage for x-axis scale factor. */
  private scaleXInternal: number = DEFAULT_SCALE;
  /** Internal storage for y-axis scale factor. */
  private scaleYInternal: number = DEFAULT_SCALE;
  /** Internal storage for rotation in radians. */
  private rotationInternal: number = DEFAULT_ROTATION;
  /** Flag indicating if any transformation properties have changed. */
  private recalculationRequired = false;

  /**
   * Gets the x-coordinate offset for micro positioning.
   * @returns The x-offset value
   */
  public get x(): number {
    return this.xInternal;
  }

  /**
   * Gets the y-coordinate offset for micro positioning.
   * @returns The y-offset value
   */
  public get y(): number {
    return this.yInternal;
  }

  /**
   * Gets the x-axis anchor point for transformations.
   * @returns The anchor point (0.0 = left, 0.5 = center, 1.0 = right)
   */
  public get anchorX(): number {
    return this.anchorXInternal;
  }

  /**
   * Gets the y-axis anchor point for transformations.
   * @returns The anchor point (0.0 = top, 0.5 = center, 1.0 = bottom)
   */
  public get anchorY(): number {
    return this.anchorYInternal;
  }

  /**
   * Gets the x-axis scale factor.
   * @returns The scale factor (1.0 = normal size)
   */
  public get scaleX(): number {
    return this.scaleXInternal;
  }

  /**
   * Gets the y-axis scale factor.
   * @returns The scale factor (1.0 = normal size)
   */
  public get scaleY(): number {
    return this.scaleYInternal;
  }

  /**
   * Gets the uniform scale factor (maximum of scaleX and scaleY).
   * @returns The larger of the two scale factors
   */
  public get size(): number {
    return Math.max(this.scaleXInternal, this.scaleYInternal);
  }

  /**
   * Gets the rotation angle in degrees.
   * @returns The rotation angle in degrees
   */
  public get angle(): number {
    return MathUtils.radToDeg(this.rotationInternal);
  }

  /**
   * Gets the rotation angle in radians.
   * @returns The rotation angle in radians
   */
  public get rotation(): number {
    return this.rotationInternal;
  }

  /**
   * Sets the x-coordinate offset for micro positioning.
   * @param value - The new x-offset value
   */
  public set x(value: number) {
    if (value !== this.xInternal) {
      this.xInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the y-coordinate offset for micro positioning.
   * @param value - The new y-offset value
   */
  public set y(value: number) {
    if (value !== this.yInternal) {
      this.yInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the x-axis anchor point for transformations.
   * @param value - The anchor point (0.0 = left, 0.5 = center, 1.0 = right)
   */
  public set anchorX(value: number) {
    if (value !== this.anchorXInternal) {
      this.anchorXInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the y-axis anchor point for transformations.
   * @param value - The anchor point (0.0 = top, 0.5 = center, 1.0 = bottom)
   */
  public set anchorY(value: number) {
    if (value !== this.anchorYInternal) {
      this.anchorYInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the x-axis scale factor.
   * @param value - The scale factor (1.0 = normal size)
   */
  public set scaleX(value: number) {
    if (value !== this.scaleXInternal) {
      this.scaleXInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the y-axis scale factor.
   * @param value - The scale factor (1.0 = normal size)
   */
  public set scaleY(value: number) {
    if (value !== this.scaleYInternal) {
      this.scaleYInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets both scale factors to the same value for uniform scaling.
   * @param value - The uniform scale factor (1.0 = normal size)
   */
  public set size(value: number) {
    if (value !== this.scaleXInternal || value !== this.scaleYInternal) {
      this.scaleXInternal = value;
      this.scaleYInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the rotation angle in degrees.
   * @param value - The rotation angle in degrees
   */
  public set angle(value: number) {
    const rotation = MathUtils.degToRad(value);
    if (rotation !== this.rotationInternal) {
      this.rotationInternal = rotation;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the rotation angle in radians.
   * @param value - The rotation angle in radians
   */
  public set rotation(value: number) {
    if (value !== this.rotationInternal) {
      this.rotationInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Resets all transformation properties to their default values.
   *
   * This method restores position (0,0), anchor (0,0), scale (1,1),
   * and rotation (0) to their initial states. Only triggers recalculation
   * if any values actually change.
   */
  public reset(): void {
    if (
      this.xInternal !== DEFAULT_POSITION ||
      this.yInternal !== DEFAULT_POSITION ||
      this.anchorXInternal !== DEFAULT_ANCHOR ||
      this.anchorYInternal !== DEFAULT_ANCHOR ||
      this.scaleXInternal !== DEFAULT_SCALE ||
      this.scaleYInternal !== DEFAULT_SCALE ||
      this.rotationInternal !== DEFAULT_ROTATION
    ) {
      this.xInternal = DEFAULT_POSITION;
      this.yInternal = DEFAULT_POSITION;
      this.anchorXInternal = DEFAULT_ANCHOR;
      this.anchorYInternal = DEFAULT_ANCHOR;
      this.scaleXInternal = DEFAULT_SCALE;
      this.scaleYInternal = DEFAULT_SCALE;
      this.rotationInternal = DEFAULT_ROTATION;
      this.recalculationRequired = true;
    }
  }

  /**
   * Gets whether any transformation properties have changed since last reset.
   *
   * This method is used internally by the rendering system to determine
   * if transformation matrices need to be recalculated.
   *
   * @returns True if recalculation is required, false otherwise
   * @internal
   */
  protected ["getRecalculationRequiredInternal"](): boolean {
    return this.recalculationRequired;
  }

  /**
   * Resets the recalculation flag after transformations have been applied.
   *
   * This method is called internally by the rendering system after
   * transformation matrices have been updated.
   *
   * @internal
   */
  protected ["resetRecalculationRequiredInternal"](): void {
    this.recalculationRequired = false;
  }
}

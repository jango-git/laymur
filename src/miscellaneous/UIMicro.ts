import { MathUtils } from "three";
import { UIMicroAnchorMode } from "./UIMicroAnchorMode";

/** Default position value for x and y coordinates. */
const DEFAULT_POSITION = 0;
/** Default anchor point value for anchorX and anchorY. */
const DEFAULT_ANCHOR = 0.5;
/** Default scale value for scaleX and scaleY. */
const DEFAULT_SCALE = 1;
/** Default rotation value in radians. */
const DEFAULT_ROTATION = 0;

/**
 * Lightweight transformation system for UI elements.
 *
 * Manages position offsets, anchor points, scaling, and rotation that operate
 * independently of the constraint solver. Useful for animations and visual
 * effects without affecting the constraint-based layout.
 *
 * Tracks changes to optimize rendering performance.
 *
 * @public
 */
export class UIMicro {
  /** @internal */
  private xInternal: number = DEFAULT_POSITION;
  /** @internal */
  private yInternal: number = DEFAULT_POSITION;
  /** @internal */
  private anchorXInternal: number = DEFAULT_ANCHOR;
  /** @internal */
  private anchorYInternal: number = DEFAULT_ANCHOR;
  /** @internal */
  private scaleXInternal: number = DEFAULT_SCALE;
  /** @internal */
  private scaleYInternal: number = DEFAULT_SCALE;
  /** @internal */
  private rotationInternal: number = DEFAULT_ROTATION;
  /** @internal */
  private anchorModeInternal: UIMicroAnchorMode =
    UIMicroAnchorMode.ROTATION_SCALE;
  /** @internal */
  private recalculationRequired = false;

  /**
   * Gets the x-coordinate offset.
   *
   * @returns X-offset value
   */
  public get x(): number {
    return this.xInternal;
  }

  /**
   * Gets the y-coordinate offset.
   *
   * @returns Y-offset value
   */
  public get y(): number {
    return this.yInternal;
  }

  /**
   * Gets the x-axis anchor point.
   *
   * @returns Anchor point (0.0 = left, 0.5 = center, 1.0 = right)
   */
  public get anchorX(): number {
    return this.anchorXInternal;
  }

  /**
   * Gets the y-axis scale factor.
   * @returns The anchor point (0.0 = bottom, 0.5 = center, 1.0 = top)
   */
  public get anchorY(): number {
    return this.anchorYInternal;
  }

  /**
   * Gets the x-axis scale factor.
   *
   * @returns Scale factor (1.0 = normal size)
   */
  public get scaleX(): number {
    return this.scaleXInternal;
  }

  /**
   * Gets the y-axis scale factor.
   *
   * @returns Scale factor (1.0 = normal size)
   */
  public get scaleY(): number {
    return this.scaleYInternal;
  }

  /**
   * Gets the uniform scale factor.
   *
   * @returns Larger of the two scale factors
   */
  public get size(): number {
    return Math.max(this.scaleXInternal, this.scaleYInternal);
  }

  /**
   * Gets the rotation angle in degrees.
   *
   * @returns Rotation angle in degrees
   */
  public get angle(): number {
    return MathUtils.radToDeg(this.rotationInternal);
  }

  /**
   * Gets the anchor mode.
   *
   * @returns Anchor mode (ROTATION_SCALE or POSITION_ROTATION_SCALE)
   */
  public get anchorMode(): UIMicroAnchorMode {
    return this.anchorModeInternal;
  }

  /**
   * Gets the rotation angle in radians.
   *
   * @returns Rotation angle in radians
   */
  public get rotation(): number {
    return this.rotationInternal;
  }

  /**
   * Sets the x-coordinate offset.
   *
   * @param value - New x-offset value
   */
  public set x(value: number) {
    if (value !== this.xInternal) {
      this.xInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the y-coordinate offset.
   *
   * @param value - New y-offset value
   */
  public set y(value: number) {
    if (value !== this.yInternal) {
      this.yInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the x-axis anchor point.
   *
   * @param value - Anchor point (0.0 = left, 0.5 = center, 1.0 = right)
   */
  public set anchorX(value: number) {
    if (value !== this.anchorXInternal) {
      this.anchorXInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the y-axis anchor point for transformations.
   * @param value - The anchor point (0.0 = bottom, 0.5 = center, 1.0 = top)
   */
  public set anchorY(value: number) {
    if (value !== this.anchorYInternal) {
      this.anchorYInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the x-axis scale factor.
   *
   * @param value - Scale factor (1.0 = normal size)
   */
  public set scaleX(value: number) {
    if (value !== this.scaleXInternal) {
      this.scaleXInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the y-axis scale factor.
   *
   * @param value - Scale factor (1.0 = normal size)
   */
  public set scaleY(value: number) {
    if (value !== this.scaleYInternal) {
      this.scaleYInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets both scale factors for uniform scaling.
   *
   * @param value - Uniform scale factor (1.0 = normal size)
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
   *
   * @param value - Rotation angle in degrees
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
   *
   * @param value - Rotation angle in radians
   */
  public set rotation(value: number) {
    if (value !== this.rotationInternal) {
      this.rotationInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the anchor mode.
   *
   * @param value - Anchor mode (ROTATION_SCALE or POSITION_ROTATION_SCALE)
   */
  public set anchorMode(value: UIMicroAnchorMode) {
    if (value !== this.anchorModeInternal) {
      this.anchorModeInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Resets all transformations to default values.
   *
   * Restores position (0,0), anchor (0.5,0.5), scale (1,1), and rotation (0).
   * Only triggers recalculation if values actually change.
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
   * Gets whether transformations have changed since last reset.
   *
   * @returns True if recalculation is required
   * @internal
   */
  protected ["getRecalculationRequiredInternal"](): boolean {
    return this.recalculationRequired;
  }

  /**
   * Resets the recalculation flag after transformations are applied.
   *
   * @internal
   */
  protected ["resetRecalculationRequiredInternal"](): void {
    this.recalculationRequired = false;
  }
}

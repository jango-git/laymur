import { MathUtils } from "three";

const DEFAULT_POSITION = 0;
const DEFAULT_ANCHOR = 0.5;
const DEFAULT_SCALE = 1;
const DEFAULT_ROTATION = 0;

export class UIMicro {
  private xInternal: number = DEFAULT_POSITION;
  private yInternal: number = DEFAULT_POSITION;
  private anchorXInternal: number = DEFAULT_ANCHOR;
  private anchorYInternal: number = DEFAULT_ANCHOR;
  private scaleXInternal: number = DEFAULT_SCALE;
  private scaleYInternal: number = DEFAULT_SCALE;
  private rotationInternal: number = DEFAULT_ROTATION;
  private recalculationRequired = false;

  public get x(): number {
    return this.xInternal;
  }

  public get y(): number {
    return this.yInternal;
  }

  public get anchorX(): number {
    return this.anchorXInternal;
  }

  public get anchorY(): number {
    return this.anchorYInternal;
  }

  public get scaleX(): number {
    return this.scaleXInternal;
  }

  public get scaleY(): number {
    return this.scaleYInternal;
  }

  public get angle(): number {
    return MathUtils.radToDeg(this.rotationInternal);
  }

  public get rotation(): number {
    return this.rotationInternal;
  }

  public set x(value: number) {
    if (value !== this.xInternal) {
      this.xInternal = value;
      this.recalculationRequired = true;
    }
  }

  /**
   * Sets the Y-axis offset from the element's position.
   *
   * @param value - Y offset in pixels
   */
  public set y(value: number) {
    if (value !== this.yInternal) {
      this.yInternal = value;
      this.recalculationRequired = true;
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
    if (value !== this.anchorXInternal) {
      this.anchorXInternal = value;
      this.recalculationRequired = true;
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
    if (value !== this.anchorYInternal) {
      this.anchorYInternal = value;
      this.recalculationRequired = true;
    }
  }

  public set scaleX(value: number) {
    if (value !== this.scaleXInternal) {
      this.scaleXInternal = value;
      this.recalculationRequired = true;
    }
  }

  public set scaleY(value: number) {
    if (value !== this.scaleYInternal) {
      this.scaleYInternal = value;
      this.recalculationRequired = true;
    }
  }

  public set angle(value: number) {
    const rotation = MathUtils.degToRad(value);
    if (rotation !== this.rotationInternal) {
      this.rotationInternal = rotation;
      this.recalculationRequired = true;
    }
  }

  public set rotation(value: number) {
    if (value !== this.rotationInternal) {
      this.rotationInternal = value;
      this.recalculationRequired = true;
    }
  }

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

  protected ["resetRecalculationRequiredInternal"](): void {
    this.recalculationRequired = false;
  }
}

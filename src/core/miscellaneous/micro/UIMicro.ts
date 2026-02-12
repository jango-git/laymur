import { MathUtils } from "three";
import { assertValidNumber } from "../asserts";
import type { UIMicroAnchorMode, UIMicroConfig } from "./UIMicro.Internal";
import {
  MICRO_DEFAULT_ANCHOR,
  MICRO_DEFAULT_ANCHOR_MODE,
  MICRO_DEFAULT_POSITION,
  MICRO_DEFAULT_ROTATION,
  MICRO_DEFAULT_SCALE,
} from "./UIMicro.Internal";

/** Transforms that don't affect constraints */
export class UIMicro {
  private xInternal: number;
  private yInternal: number;
  private anchorXInternal: number;
  private anchorYInternal: number;
  private scaleXInternal: number;
  private scaleYInternal: number;
  private rotationInternal: number;
  private anchorModeInternal: UIMicroAnchorMode;

  private dirtyInternal = true;

  /**
   * Creates UIMicro instance.
   *
   * @param config - Transform configuration
   */
  constructor(config?: Partial<UIMicroConfig>) {
    this.xInternal = config?.x ?? MICRO_DEFAULT_POSITION;
    this.yInternal = config?.y ?? MICRO_DEFAULT_POSITION;
    this.anchorXInternal = config?.anchorX ?? MICRO_DEFAULT_ANCHOR;
    this.anchorYInternal = config?.anchorY ?? MICRO_DEFAULT_ANCHOR;
    this.scaleXInternal = config?.scaleX ?? MICRO_DEFAULT_SCALE;
    this.scaleYInternal = config?.scaleY ?? MICRO_DEFAULT_SCALE;
    this.rotationInternal = config?.rotation ?? MICRO_DEFAULT_ROTATION;
    this.anchorModeInternal = config?.anchorMode ?? MICRO_DEFAULT_ANCHOR_MODE;
  }

  /** X offset in world units */
  public get x(): number {
    return this.xInternal;
  }

  /** Y offset in world units */
  public get y(): number {
    return this.yInternal;
  }

  /** X anchor in normalized coordinates (0 to 1) */
  public get anchorX(): number {
    return this.anchorXInternal;
  }

  /** Y anchor in normalized coordinates (0 to 1) */
  public get anchorY(): number {
    return this.anchorYInternal;
  }

  /** X scale multiplier */
  public get scaleX(): number {
    return this.scaleXInternal;
  }

  /** Y scale multiplier */
  public get scaleY(): number {
    return this.scaleYInternal;
  }

  /** Rotation in degrees */
  public get angle(): number {
    return MathUtils.radToDeg(this.rotationInternal);
  }

  /** Which transforms apply relative to anchor */
  public get anchorMode(): UIMicroAnchorMode {
    return this.anchorModeInternal;
  }

  /** Rotation in radians */
  public get rotation(): number {
    return this.rotationInternal;
  }

  /** @internal */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  /** X offset in world units */
  public set x(value: number) {
    assertValidNumber(value, "UIMicro.x");
    if (value !== this.xInternal) {
      this.xInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Y offset in world units */
  public set y(value: number) {
    assertValidNumber(value, "UIMicro.y");
    if (value !== this.yInternal) {
      this.yInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** X anchor in normalized coordinates (0 to 1) */
  public set anchorX(value: number) {
    assertValidNumber(value, "UIMicro.anchorX");
    if (value !== this.anchorXInternal) {
      this.anchorXInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Y anchor in normalized coordinates (0 to 1) */
  public set anchorY(value: number) {
    assertValidNumber(value, "UIMicro.anchorY");
    if (value !== this.anchorYInternal) {
      this.anchorYInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** X scale multiplier */
  public set scaleX(value: number) {
    assertValidNumber(value, "UIMicro.scaleX");
    if (value !== this.scaleXInternal) {
      this.scaleXInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Y scale multiplier */
  public set scaleY(value: number) {
    assertValidNumber(value, "UIMicro.scaleY");
    if (value !== this.scaleYInternal) {
      this.scaleYInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Rotation in degrees */
  public set angle(value: number) {
    assertValidNumber(value, "UIMicro.angle");
    const rotation = MathUtils.degToRad(value);
    if (rotation !== this.rotationInternal) {
      this.rotationInternal = rotation;
      this.dirtyInternal = true;
    }
  }

  /** Rotation in radians */
  public set rotation(value: number) {
    assertValidNumber(value, "UIMicro.rotation");
    if (value !== this.rotationInternal) {
      this.rotationInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Which transforms apply relative to anchor */
  public set anchorMode(value: UIMicroAnchorMode) {
    if (value !== this.anchorModeInternal) {
      this.anchorModeInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets the same scale for X and Y */
  public setUnifiedScale(scale: number): void {
    assertValidNumber(scale, "UIMicro.setUnifiedScale.scale");
    if (scale !== this.scaleXInternal || scale !== this.scaleYInternal) {
      this.scaleXInternal = scale;
      this.scaleYInternal = scale;
      this.dirtyInternal = true;
    }
  }

  /** Sets the same anchor for X and Y */
  public setUnifiedAnchor(anchor: number): void {
    assertValidNumber(anchor, "UIMicro.setUnifiedAnchor.anchor");
    if (anchor !== this.anchorXInternal || anchor !== this.anchorYInternal) {
      this.anchorXInternal = anchor;
      this.anchorYInternal = anchor;
      this.dirtyInternal = true;
    }
  }

  /** @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
  }

  /** Resets all transforms to defaults */
  public reset(): void {
    if (
      this.xInternal !== MICRO_DEFAULT_POSITION ||
      this.yInternal !== MICRO_DEFAULT_POSITION ||
      this.anchorXInternal !== MICRO_DEFAULT_ANCHOR ||
      this.anchorYInternal !== MICRO_DEFAULT_ANCHOR ||
      this.scaleXInternal !== MICRO_DEFAULT_SCALE ||
      this.scaleYInternal !== MICRO_DEFAULT_SCALE ||
      this.rotationInternal !== MICRO_DEFAULT_ROTATION
    ) {
      this.xInternal = MICRO_DEFAULT_POSITION;
      this.yInternal = MICRO_DEFAULT_POSITION;
      this.anchorXInternal = MICRO_DEFAULT_ANCHOR;
      this.anchorYInternal = MICRO_DEFAULT_ANCHOR;
      this.scaleXInternal = MICRO_DEFAULT_SCALE;
      this.scaleYInternal = MICRO_DEFAULT_SCALE;
      this.rotationInternal = MICRO_DEFAULT_ROTATION;
      this.dirtyInternal = true;
    }
  }

  /** Copies transforms from another instance */
  public copy(value: UIMicro): void {
    if (
      this.xInternal !== value.xInternal ||
      this.yInternal !== value.yInternal ||
      this.anchorXInternal !== value.anchorXInternal ||
      this.anchorYInternal !== value.anchorYInternal ||
      this.scaleXInternal !== value.scaleXInternal ||
      this.scaleYInternal !== value.scaleYInternal ||
      this.rotationInternal !== value.rotationInternal ||
      this.anchorModeInternal !== value.anchorModeInternal
    ) {
      this.xInternal = value.xInternal;
      this.yInternal = value.yInternal;
      this.anchorXInternal = value.anchorXInternal;
      this.anchorYInternal = value.anchorYInternal;
      this.scaleXInternal = value.scaleXInternal;
      this.scaleYInternal = value.scaleYInternal;
      this.rotationInternal = value.rotationInternal;
      this.anchorModeInternal = value.anchorModeInternal;
      this.dirtyInternal = true;
    }
  }
}

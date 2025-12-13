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

/**
 * Micro-transformation system for UI elements.
 * Manages position, anchor, scale, and rotation independently of constraints.
 */
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

  /** X-coordinate offset. */
  public get x(): number {
    return this.xInternal;
  }

  /** Y-coordinate offset. */
  public get y(): number {
    return this.yInternal;
  }

  /** X-axis anchor point (0 = left, 0.5 = center, 1 = right). */
  public get anchorX(): number {
    return this.anchorXInternal;
  }

  /** Y-axis anchor point (0 = top, 0.5 = center, 1 = bottom). */
  public get anchorY(): number {
    return this.anchorYInternal;
  }

  /** X-axis scale factor. */
  public get scaleX(): number {
    return this.scaleXInternal;
  }

  /** Y-axis scale factor. */
  public get scaleY(): number {
    return this.scaleYInternal;
  }

  /** Rotation in degrees. */
  public get angle(): number {
    return MathUtils.radToDeg(this.rotationInternal);
  }

  /** Anchor mode. */
  public get anchorMode(): UIMicroAnchorMode {
    return this.anchorModeInternal;
  }

  /** Rotation in radians. */
  public get rotation(): number {
    return this.rotationInternal;
  }

  /**
   * Indicates whether any transformation has been modified.
   * Must be reset to `false` externally by the owner.
   * @internal
   */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  public set x(value: number) {
    assertValidNumber(value, "UIMicro.x");
    if (value !== this.xInternal) {
      this.xInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set y(value: number) {
    assertValidNumber(value, "UIMicro.y");
    if (value !== this.yInternal) {
      this.yInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set anchorX(value: number) {
    assertValidNumber(value, "UIMicro.anchorX");
    if (value !== this.anchorXInternal) {
      this.anchorXInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set anchorY(value: number) {
    assertValidNumber(value, "UIMicro.anchorY");
    if (value !== this.anchorYInternal) {
      this.anchorYInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set scaleX(value: number) {
    assertValidNumber(value, "UIMicro.scaleX");
    if (value !== this.scaleXInternal) {
      this.scaleXInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set scaleY(value: number) {
    assertValidNumber(value, "UIMicro.scaleY");
    if (value !== this.scaleYInternal) {
      this.scaleYInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set angle(value: number) {
    assertValidNumber(value, "UIMicro.angle");
    const rotation = MathUtils.degToRad(value);
    if (rotation !== this.rotationInternal) {
      this.rotationInternal = rotation;
      this.dirtyInternal = true;
    }
  }

  public set rotation(value: number) {
    assertValidNumber(value, "UIMicro.rotation");
    if (value !== this.rotationInternal) {
      this.rotationInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set anchorMode(value: UIMicroAnchorMode) {
    if (value !== this.anchorModeInternal) {
      this.anchorModeInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
  }

  /** Resets all transformations to defaults. */
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

  /** Copies transformations from another UIMicro. */
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

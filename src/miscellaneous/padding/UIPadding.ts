import { Vector4 } from "three";
import { assertValidNonNegativeNumber } from "../asserts";
import type { UIPaddingConfig } from "./UIPadding.Internal";
import { PADDING_DEFAULT_VALU } from "./UIPadding.Internal";

/**
 * Padding values for UI elements (left, right, top, bottom).
 * All values must be non-negative.
 */
export class UIPadding {
  private lInternal: number;
  private rInternal: number;
  private tInternal: number;
  private bInternal: number;

  private dirtyInternal = false;

  constructor(config?: UIPaddingConfig) {
    if (config === undefined) {
      this.lInternal = PADDING_DEFAULT_VALU;
      this.rInternal = PADDING_DEFAULT_VALU;
      this.tInternal = PADDING_DEFAULT_VALU;
      this.bInternal = PADDING_DEFAULT_VALU;
    } else if (typeof config === "number") {
      assertValidNonNegativeNumber(config, "UIBorder.constructor.config");
      this.lInternal = config;
      this.rInternal = config;
      this.tInternal = config;
      this.bInternal = config;
    } else if ("left" in config) {
      const left = config.left;
      const right = config.right;
      const top = config.top;
      const bottom = config.bottom;
      assertValidNonNegativeNumber(left, "UIBorder.constructor.config.left");
      assertValidNonNegativeNumber(right, "UIBorder.constructor.config.right");
      assertValidNonNegativeNumber(top, "UIBorder.constructor.config.top");
      assertValidNonNegativeNumber(
        bottom,
        "UIBorder.constructor.config.bottom",
      );
      this.lInternal = left;
      this.rInternal = right;
      this.tInternal = top;
      this.bInternal = bottom;
    } else {
      const horizontal = config.horizontal;
      const vertical = config.vertical;
      assertValidNonNegativeNumber(
        horizontal,
        "UIBorder.constructor.config.horizontal",
      );
      assertValidNonNegativeNumber(
        vertical,
        "UIBorder.constructor.config.vertical",
      );
      this.lInternal = horizontal;
      this.rInternal = horizontal;
      this.tInternal = vertical;
      this.bInternal = vertical;
    }
  }

  /** Left border value. */
  public get left(): number {
    return this.lInternal;
  }

  /** Right border value. */
  public get right(): number {
    return this.rInternal;
  }

  /** Top border value. */
  public get top(): number {
    return this.tInternal;
  }

  /** Bottom border value. */
  public get bottom(): number {
    return this.bInternal;
  }

  /**
   * Indicates whether any border value has been modified.
   * Must be reset to `false` externally by the owner.
   * @internal
   */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  public set left(value: number) {
    assertValidNonNegativeNumber(value, "UIBorder.left");
    if (this.lInternal !== value) {
      this.lInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set right(value: number) {
    assertValidNonNegativeNumber(value, "UIBorder.right");
    if (this.rInternal !== value) {
      this.rInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set top(value: number) {
    assertValidNonNegativeNumber(value, "UIBorder.top");
    if (this.tInternal !== value) {
      this.tInternal = value;
      this.dirtyInternal = true;
    }
  }

  public set bottom(value: number) {
    assertValidNonNegativeNumber(value, "UIBorder.bottom");
    if (this.bInternal !== value) {
      this.bInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets left and right to the same value. */
  public setHorizontal(value: number): void {
    assertValidNonNegativeNumber(value, "UIBorder.setHorizontal.value");
    if (this.lInternal !== value || this.rInternal !== value) {
      this.lInternal = value;
      this.rInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets top and bottom to the same value. */
  public setVertical(value: number): void {
    assertValidNonNegativeNumber(value, "UIBorder.setVertical.value");
    if (this.tInternal !== value || this.bInternal !== value) {
      this.tInternal = value;
      this.bInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets all borders to the same value. */
  public setUnified(value: number): void {
    assertValidNonNegativeNumber(value, "UIBorder.setUnified.value");
    if (
      this.lInternal !== value ||
      this.rInternal !== value ||
      this.tInternal !== value ||
      this.bInternal !== value
    ) {
      this.lInternal = value;
      this.rInternal = value;
      this.tInternal = value;
      this.bInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets from Vector4 (x=left, y=right, z=top, w=bottom). */
  public setVector4(vector: Vector4): void {
    assertValidNonNegativeNumber(vector.x, "UIBorder.setVector4.vector.x");
    assertValidNonNegativeNumber(vector.y, "UIBorder.setVector4.vector.y");
    assertValidNonNegativeNumber(vector.z, "UIBorder.setVector4.vector.z");
    assertValidNonNegativeNumber(vector.w, "UIBorder.setVector4.vector.w");
    if (
      this.lInternal !== vector.x ||
      this.rInternal !== vector.y ||
      this.tInternal !== vector.z ||
      this.bInternal !== vector.w
    ) {
      this.lInternal = vector.x;
      this.rInternal = vector.y;
      this.tInternal = vector.z;
      this.bInternal = vector.w;
      this.dirtyInternal = true;
    }
  }

  /** Converts to Vector4 (left, right, top, bottom). */
  public toVector4(result = new Vector4()): Vector4 {
    return result.set(
      this.lInternal,
      this.rInternal,
      this.tInternal,
      this.bInternal,
    );
  }

  /** Resets all borders to 0. */
  public reset(): void {
    this.setUnified(0);
  }

  /** Copies values from another UIBorder. */
  public copy(other: UIPadding): void {
    if (
      this.lInternal !== other.lInternal ||
      this.rInternal !== other.rInternal ||
      this.tInternal !== other.tInternal ||
      this.bInternal !== other.bInternal
    ) {
      this.lInternal = other.lInternal;
      this.rInternal = other.rInternal;
      this.tInternal = other.tInternal;
      this.bInternal = other.bInternal;
      this.dirtyInternal = true;
    }
  }

  /** @internal */
  public setDirtyFalse(): void {
    this.dirtyInternal = false;
  }
}

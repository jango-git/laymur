import { Vector4 } from "three";
import { assertValidNonNegativeNumber } from "../asserts";
import type { UIPaddingConfig } from "./UIPadding.Internal";
import { PADDING_DEFAULT_VALUE } from "./UIPadding.Internal";

/** Padding values for four sides */
export class UIPadding {
  private lInternal: number;
  private rInternal: number;
  private tInternal: number;
  private bInternal: number;

  private dirtyInternal = false;

  /**
   * Creates UIPadding instance.
   *
   * @param config - Padding configuration
   */
  constructor(config?: UIPaddingConfig) {
    if (config === undefined) {
      this.lInternal = PADDING_DEFAULT_VALUE;
      this.rInternal = PADDING_DEFAULT_VALUE;
      this.tInternal = PADDING_DEFAULT_VALUE;
      this.bInternal = PADDING_DEFAULT_VALUE;
    } else if (typeof config === "number") {
      assertValidNonNegativeNumber(config, "UIPadding.constructor.config");
      this.lInternal = config;
      this.rInternal = config;
      this.tInternal = config;
      this.bInternal = config;
    } else if ("left" in config) {
      const left = config.left;
      const right = config.right;
      const top = config.top;
      const bottom = config.bottom;
      assertValidNonNegativeNumber(left, "UIPadding.constructor.config.left");
      assertValidNonNegativeNumber(right, "UIPadding.constructor.config.right");
      assertValidNonNegativeNumber(top, "UIPadding.constructor.config.top");
      assertValidNonNegativeNumber(
        bottom,
        "UIPadding.constructor.config.bottom",
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
        "UIPadding.constructor.config.horizontal",
      );
      assertValidNonNegativeNumber(
        vertical,
        "UIPadding.constructor.config.vertical",
      );
      this.lInternal = horizontal;
      this.rInternal = horizontal;
      this.tInternal = vertical;
      this.bInternal = vertical;
    }
  }

  /** Left padding */
  public get left(): number {
    return this.lInternal;
  }

  /** Right padding */
  public get right(): number {
    return this.rInternal;
  }

  /** Top padding */
  public get top(): number {
    return this.tInternal;
  }

  /** Bottom padding */
  public get bottom(): number {
    return this.bInternal;
  }

  /** @internal */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  /** Left padding */
  public set left(value: number) {
    assertValidNonNegativeNumber(value, "UIPadding.left");
    if (this.lInternal !== value) {
      this.lInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Right padding */
  public set right(value: number) {
    assertValidNonNegativeNumber(value, "UIPadding.right");
    if (this.rInternal !== value) {
      this.rInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Top padding */
  public set top(value: number) {
    assertValidNonNegativeNumber(value, "UIPadding.top");
    if (this.tInternal !== value) {
      this.tInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Bottom padding */
  public set bottom(value: number) {
    assertValidNonNegativeNumber(value, "UIPadding.bottom");
    if (this.bInternal !== value) {
      this.bInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets left and right to same value */
  public setHorizontal(value: number): void {
    assertValidNonNegativeNumber(value, "UIPadding.setHorizontal.value");
    if (this.lInternal !== value || this.rInternal !== value) {
      this.lInternal = value;
      this.rInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets top and bottom to same value */
  public setVertical(value: number): void {
    assertValidNonNegativeNumber(value, "UIPadding.setVertical.value");
    if (this.tInternal !== value || this.bInternal !== value) {
      this.tInternal = value;
      this.bInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets all sides to same value */
  public setUnified(value: number): void {
    assertValidNonNegativeNumber(value, "UIPadding.setUnified.value");
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

  /** Sets from Vector4 (x=left, y=right, z=top, w=bottom) */
  public setVector4(vector: Vector4): void {
    assertValidNonNegativeNumber(vector.x, "UIPadding.setVector4.vector.x");
    assertValidNonNegativeNumber(vector.y, "UIPadding.setVector4.vector.y");
    assertValidNonNegativeNumber(vector.z, "UIPadding.setVector4.vector.z");
    assertValidNonNegativeNumber(vector.w, "UIPadding.setVector4.vector.w");
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

  /** Converts to Vector4 (left, right, top, bottom) */
  public toVector4(result = new Vector4()): Vector4 {
    return result.set(
      this.lInternal,
      this.rInternal,
      this.tInternal,
      this.bInternal,
    );
  }

  /** Resets all sides to 0 */
  public reset(): void {
    this.setUnified(0);
  }

  /** Copies from another instance */
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

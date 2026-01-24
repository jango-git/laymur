import { Vector4 } from "three";
import { assertValidNonNegativeNumber } from "../asserts";
import type { UIInsetsConfig } from "./UIInsets.Internal";
import { INSETS_DEFAULT_VALUE } from "./UIInsets.Internal";

/** Insets values for four sides */
export class UIInsets {
  private lInternal = INSETS_DEFAULT_VALUE;
  private rInternal = INSETS_DEFAULT_VALUE;
  private tInternal = INSETS_DEFAULT_VALUE;
  private bInternal = INSETS_DEFAULT_VALUE;

  private dirtyInternal = false;

  /**
   * Creates UIInsets instance.
   *
   * @param config - Insets configuration
   */
  constructor(config?: UIInsetsConfig) {
    this.set(config);
  }

  /** Left inset */
  public get left(): number {
    return this.lInternal;
  }

  /** Right inset */
  public get right(): number {
    return this.rInternal;
  }

  /** Top inset */
  public get top(): number {
    return this.tInternal;
  }

  /** Bottom inset */
  public get bottom(): number {
    return this.bInternal;
  }

  /** @internal */
  public get dirty(): boolean {
    return this.dirtyInternal;
  }

  /** Left inset */
  public set left(value: number) {
    assertValidNonNegativeNumber(value, "UIInsets.left");
    if (this.lInternal !== value) {
      this.lInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Right inset */
  public set right(value: number) {
    assertValidNonNegativeNumber(value, "UIInsets.right");
    if (this.rInternal !== value) {
      this.rInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Top inset */
  public set top(value: number) {
    assertValidNonNegativeNumber(value, "UIInsets.top");
    if (this.tInternal !== value) {
      this.tInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Bottom inset */
  public set bottom(value: number) {
    assertValidNonNegativeNumber(value, "UIInsets.bottom");
    if (this.bInternal !== value) {
      this.bInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets left and right to same value */
  public setHorizontal(value: number): void {
    assertValidNonNegativeNumber(value, "UIInsets.setHorizontal.value");
    if (this.lInternal !== value || this.rInternal !== value) {
      this.lInternal = value;
      this.rInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets top and bottom to same value */
  public setVertical(value: number): void {
    assertValidNonNegativeNumber(value, "UIInsets.setVertical.value");
    if (this.tInternal !== value || this.bInternal !== value) {
      this.tInternal = value;
      this.bInternal = value;
      this.dirtyInternal = true;
    }
  }

  /** Sets all sides to same value */
  public setUnified(value: number): void {
    assertValidNonNegativeNumber(value, "UIInsets.setUnified.value");
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

  /** Sets insets */
  public set(config?: UIInsetsConfig): void {
    const lOld = this.lInternal;
    const rOld = this.rInternal;
    const tOld = this.tInternal;
    const bOld = this.bInternal;

    if (config === undefined) {
      this.lInternal = INSETS_DEFAULT_VALUE;
      this.rInternal = INSETS_DEFAULT_VALUE;
      this.tInternal = INSETS_DEFAULT_VALUE;
      this.bInternal = INSETS_DEFAULT_VALUE;
    } else if (typeof config === "number") {
      assertValidNonNegativeNumber(config, "UIInsets.set.config");
      this.lInternal = config;
      this.rInternal = config;
      this.tInternal = config;
      this.bInternal = config;
    } else if (Array.isArray(config)) {
      if (config.length === 2) {
        const horizontal = config[0];
        const vertical = config[1];
        assertValidNonNegativeNumber(horizontal, "UIInsets.set.config[0]");
        assertValidNonNegativeNumber(vertical, "UIInsets.set.config[1]");
        this.lInternal = horizontal;
        this.rInternal = horizontal;
        this.tInternal = vertical;
        this.bInternal = vertical;
      } else {
        const left = config[0];
        const right = config[1];
        const top = config[2];
        const bottom = config[3];
        assertValidNonNegativeNumber(left, "UIInsets.set.config[0]");
        assertValidNonNegativeNumber(right, "UIInsets.set.config[1]");
        assertValidNonNegativeNumber(top, "UIInsets.set.config[2]");
        assertValidNonNegativeNumber(bottom, "UIInsets.set.config[3]");
        this.lInternal = left;
        this.rInternal = right;
        this.tInternal = top;
        this.bInternal = bottom;
      }
    } else if ("left" in config) {
      const left = config.left;
      const right = config.right;
      const top = config.top;
      const bottom = config.bottom;
      assertValidNonNegativeNumber(left, "UIInsets.set.config.left");
      assertValidNonNegativeNumber(right, "UIInsets.set.config.right");
      assertValidNonNegativeNumber(top, "UIInsets.set.config.top");
      assertValidNonNegativeNumber(bottom, "UIInsets.set.config.bottom");
      this.lInternal = left;
      this.rInternal = right;
      this.tInternal = top;
      this.bInternal = bottom;
    } else {
      const horizontal = config.horizontal;
      const vertical = config.vertical;
      assertValidNonNegativeNumber(horizontal, "UIInsets.set.config.horizontal");
      assertValidNonNegativeNumber(vertical, "UIInsets.set.config.vertical");
      this.lInternal = horizontal;
      this.rInternal = horizontal;
      this.tInternal = vertical;
      this.bInternal = vertical;
    }

    if (
      this.lInternal !== lOld ||
      this.rInternal !== rOld ||
      this.tInternal !== tOld ||
      this.bInternal !== bOld
    ) {
      this.dirtyInternal = true;
    }
  }

  /** Sets from Vector4 (x=left, y=right, z=top, w=bottom) */
  public setVector4(vector: Vector4): void {
    assertValidNonNegativeNumber(vector.x, "UIInsets.setVector4.vector.x");
    assertValidNonNegativeNumber(vector.y, "UIInsets.setVector4.vector.y");
    assertValidNonNegativeNumber(vector.z, "UIInsets.setVector4.vector.z");
    assertValidNonNegativeNumber(vector.w, "UIInsets.setVector4.vector.w");
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
    return result.set(this.lInternal, this.rInternal, this.tInternal, this.bInternal);
  }

  /** Resets all sides to 0 */
  public reset(): void {
    this.setUnified(0);
  }

  /** Copies from another instance */
  public copy(other: UIInsets): void {
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

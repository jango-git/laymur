import { Vector4 } from "three";

export type UIBorderConfig =
  | { horizontal: number; vertical: number }
  | { left: number; right: number; top: number; bottom: number }
  | number
  | undefined;

export class UIBorder {
  /** @internal */
  public dirty = true;

  private lInternal: number;
  private rInternal: number;
  private tInternal: number;
  private bInternal: number;

  constructor(config: UIBorderConfig) {
    if (config === undefined) {
      this.lInternal = 0;
      this.rInternal = 0;
      this.tInternal = 0;
      this.bInternal = 0;
    } else if (typeof config === "number") {
      this.lInternal = config;
      this.rInternal = config;
      this.tInternal = config;
      this.bInternal = config;
    } else if ("left" in config) {
      this.lInternal = config.left;
      this.rInternal = config.right;
      this.tInternal = config.top;
      this.bInternal = config.bottom;
    } else {
      this.lInternal = config.horizontal;
      this.rInternal = config.horizontal;
      this.tInternal = config.vertical;
      this.bInternal = config.vertical;
    }
  }

  public get left(): number {
    return this.lInternal;
  }

  public get right(): number {
    return this.rInternal;
  }

  public get top(): number {
    return this.tInternal;
  }

  public get bottom(): number {
    return this.bInternal;
  }

  public set left(value: number) {
    if (this.lInternal !== value) {
      this.lInternal = value;
      this.dirty = true;
    }
  }

  public set right(value: number) {
    if (this.rInternal !== value) {
      this.rInternal = value;
      this.dirty = true;
    }
  }

  public set top(value: number) {
    if (this.tInternal !== value) {
      this.tInternal = value;
      this.dirty = true;
    }
  }

  public set bottom(value: number) {
    if (this.bInternal !== value) {
      this.bInternal = value;
      this.dirty = true;
    }
  }

  public setHorizontal(value: number): void {
    if (this.lInternal !== value || this.rInternal !== value) {
      this.lInternal = value;
      this.rInternal = value;
      this.dirty = true;
    }
  }

  public setVertical(value: number): void {
    if (this.tInternal !== value || this.bInternal !== value) {
      this.tInternal = value;
      this.bInternal = value;
      this.dirty = true;
    }
  }

  public setUnified(value: number): void {
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
      this.dirty = true;
    }
  }

  public toVector4(result = new Vector4()): Vector4 {
    return result.set(
      this.lInternal,
      this.rInternal,
      this.tInternal,
      this.bInternal,
    );
  }

  public fromVector4(vector: Vector4): void {
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
      this.dirty = true;
    }
  }

  public reset(): void {
    this.setUnified(0);
  }

  public copy(other: UIBorder): void {
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
      this.dirty = true;
    }
  }
}

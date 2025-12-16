import type { Vector2Like } from "three";
import { Vector2 } from "three";
import source from "../../shaders/UIProgressMaskFunctionDirectional.glsl";
import { EPSILON } from "../asserts";
import type { UIPropertyType } from "../generic-plane/shared";
import { UIProgressMaskFunction } from "./UIProgressMaskFunction";

export class UIProgressMaskFunctionDirectional extends UIProgressMaskFunction {
  public readonly direction = new Vector2();
  private readonly cachedDirection = new Vector2();

  constructor(direction: Vector2Like = { x: 1, y: 0 }) {
    super(source);
    this.direction.copy(direction).normalize();
    this.cachedDirection.copy(this.direction);
  }

  /** @internal */
  public override get dirty(): boolean {
    this.ensureDirectionNormalized();
    return this.dirtyInternal || !this.cachedDirection.equals(this.direction);
  }

  /** @internal */
  public override setDirtyFalse(): void {
    this.ensureDirectionNormalized();
    this.cachedDirection.copy(this.direction);
    super.setDirtyFalse();
  }

  /** @internal */
  public enumerateProperties(): Record<string, UIPropertyType> {
    this.ensureDirectionNormalized();
    return { direction: this.direction };
  }

  private ensureDirectionNormalized(): void {
    const squaredLength = this.direction.lengthSq();
    if (Math.abs(squaredLength) <= EPSILON) {
      this.direction.set(1, 0);
    } else if (Math.abs(squaredLength - 1) > EPSILON) {
      this.direction.divideScalar(squaredLength);
    }
  }
}

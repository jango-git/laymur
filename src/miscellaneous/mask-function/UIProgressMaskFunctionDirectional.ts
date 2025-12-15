import type { Vector2Like } from "three";
import { Vector2 } from "three";
import type { UIPropertyType } from "../generic-plane/shared";
import { UIProgressMaskFunction } from "./UIProgressMaskFunction";

const SOURCE = `float calculateMask() {
  float aspect = p_textureResolution.x / p_textureResolution.y;
  vec2 halfExtents = vec2(aspect, 1.0) * 0.5;

  // Максимальная проекция для данного направления (до края прямоугольника)
  float maxProjection = dot(halfExtents, abs(p_direction));

  vec2 correctedUV = (p_uv - 0.5) * vec2(aspect, 1.0);
  float projection = dot(correctedUV, p_direction);

  // Нормализуем в [0, 1]: -maxProjection -> 0, +maxProjection -> 1
  float offset = (projection / maxProjection + 1.0) * 0.5;

  return step(offset, p_progress);
}`;

const EPSILON = 0.001;

export class UIProgressMaskFunctionDirectional extends UIProgressMaskFunction {
  public readonly direction = new Vector2();
  private readonly cachedDirection = new Vector2();

  constructor(direction: Vector2Like = { x: 1, y: 0 }) {
    super(SOURCE);
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

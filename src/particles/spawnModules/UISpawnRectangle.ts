import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import type { Vector2Like } from "../../core/miscellaneous/math";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  resolveUIVector2Config,
  type UIVector2Config,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRectangle extends UISpawnModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private minInternal: Vector2Like;
  private maxInternal: Vector2Like;

  constructor(min: UIVector2Config = { x: -50, y: -50 }, max: UIVector2Config = { x: 50, y: 50 }) {
    super();
    this.minInternal = resolveUIVector2Config(min);
    this.maxInternal = resolveUIVector2Config(max);
    assertValidNumber(this.minInternal.x, "UISpawnRectangle.constructor.min.x");
    assertValidNumber(this.minInternal.y, "UISpawnRectangle.constructor.min.y");
    assertValidNumber(this.maxInternal.x, "UISpawnRectangle.constructor.max.x");
    assertValidNumber(this.maxInternal.y, "UISpawnRectangle.constructor.max.y");
  }

  public get min(): Vector2Like {
    return this.minInternal;
  }

  public get max(): Vector2Like {
    return this.maxInternal;
  }

  public set min(value: UIVector2Config) {
    this.minInternal = resolveUIVector2Config(value);
    assertValidNumber(this.minInternal.x, "UISpawnRectangle.min.x");
    assertValidNumber(this.minInternal.y, "UISpawnRectangle.min.y");
  }

  public set max(value: UIVector2Config) {
    this.maxInternal = resolveUIVector2Config(value);
    assertValidNumber(this.maxInternal.x, "UISpawnRectangle.max.x");
    assertValidNumber(this.maxInternal.y, "UISpawnRectangle.max.y");
  }

  /** @internal */
  public spawn(
    properties: { builtin: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { x: minX, y: minY } = this.minInternal;
    const { x: maxX, y: maxY } = this.maxInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * itemSize;
      array[itemOffset + BUILTIN_OFFSET_POSITION_X] = MathUtils.randFloat(minX, maxX);
      array[itemOffset + BUILTIN_OFFSET_POSITION_Y] = MathUtils.randFloat(minY, maxY);
    }

    builtin.needsUpdate = true;
  }
}

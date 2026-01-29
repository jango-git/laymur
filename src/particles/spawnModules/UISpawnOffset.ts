import type { InstancedBufferAttribute } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import type { Vector2Like } from "../../core/miscellaneous/math";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  resolveUIVector2Config,
  type UIVector2Config,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnOffset extends UISpawnModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private offsetInternal: Vector2Like;

  constructor(offset: UIVector2Config = { x: 0, y: 0 }) {
    super();
    this.offsetInternal = resolveUIVector2Config(offset);
    assertValidNumber(this.offsetInternal.x, "UISpawnOffset.constructor.offset.x");
    assertValidNumber(this.offsetInternal.y, "UISpawnOffset.constructor.offset.y");
  }

  public get offset(): Vector2Like {
    return this.offsetInternal;
  }

  public set offset(value: UIVector2Config) {
    this.offsetInternal = resolveUIVector2Config(value);
    assertValidNumber(this.offsetInternal.x, "UISpawnOffset.offset.x");
    assertValidNumber(this.offsetInternal.y, "UISpawnOffset.offset.y");
  }

  /** @internal */
  public spawn(
    properties: { builtin: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { x: offsetX, y: offsetY } = this.offsetInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * itemSize;
      array[itemOffset + BUILTIN_OFFSET_POSITION_X] = offsetX;
      array[itemOffset + BUILTIN_OFFSET_POSITION_Y] = offsetY;
    }

    builtin.needsUpdate = true;
  }
}

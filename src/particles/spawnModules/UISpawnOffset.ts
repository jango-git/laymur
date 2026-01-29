import type { InstancedBufferAttribute } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { resolveUIVector2Config, type UIVector2Config } from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnOffset extends UISpawnModule<{ position: "Vector2" }> {
  /** @internal */
  public readonly requiredProperties = { position: "Vector2" } as const;
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
    properties: { position: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { position: positionAttribute } = properties;
    const { itemSize: positionItemSize, array: positionArray } = positionAttribute;
    const { x: offsetX, y: offsetY } = this.offsetInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * positionItemSize;
      positionArray[itemOffset] = offsetX;
      positionArray[itemOffset + 1] = offsetY;
    }

    positionAttribute.needsUpdate = true;
  }
}

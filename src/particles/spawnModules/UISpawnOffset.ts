import type { InstancedBufferAttribute } from "three";
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
  }

  public get min(): Vector2Like {
    return this.offsetInternal;
  }

  public set min(value: UIVector2Config) {
    this.offsetInternal = resolveUIVector2Config(value);
  }

  /** @internal */
  public spawn(
    properties: { position: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const position = properties.position;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * position.itemSize;
      position.array[itemOffset] = this.offsetInternal.x;
      position.array[itemOffset + 1] = this.offsetInternal.y;
    }

    position.needsUpdate = true;
  }
}

import type { InstancedBufferAttribute } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnOffset extends UISpawnModule<{ position: "Vector2" }> {
  /** @internal */
  public readonly requiredProperties = { position: "Vector2" } as const;

  constructor(public readonly offset: Vector2Like = { x: 0, y: 0 }) {
    super();
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
      position.array[itemOffset] = this.offset.x;
      position.array[itemOffset + 1] = this.offset.y;
    }

    position.needsUpdate = true;
  }
}

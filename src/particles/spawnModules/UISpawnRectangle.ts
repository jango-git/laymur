import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRectangle extends UISpawnModule<{ position: "Vector2" }> {
  /** @internal */
  public readonly requiredProperties = { position: "Vector2" } as const;

  constructor(
    public readonly min: Vector2Like = { x: -50, y: -50 },
    public readonly max: Vector2Like = { x: 50, y: 50 },
  ) {
    super();
  }

  /** @internal */
  public spawn(
    properties: { position: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const positionBuffer = properties.position;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * positionBuffer.itemSize;
      positionBuffer.array[itemOffset] = MathUtils.randFloat(this.min.x, this.max.x);
      positionBuffer.array[itemOffset + 1] = MathUtils.randFloat(this.min.y, this.max.y);
    }

    positionBuffer.needsUpdate = true;
  }
}

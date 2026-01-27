import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import type { UIRange } from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomVelocity extends UISpawnModule<{ velocity: "Vector2" }> {
  /** @internal */
  public readonly requiredProperties = { velocity: "Vector2" } as const;

  constructor(
    public readonly angle: UIRange = { min: -Math.PI, max: Math.PI },
    public readonly magnitude: UIRange = { min: -50, max: 50 },
  ) {
    super();
  }

  /** @internal */
  public spawn(
    properties: { velocity: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const angle = MathUtils.randFloat(this.angle.min, this.angle.max);
    const magnitude = MathUtils.randFloat(this.magnitude.min, this.magnitude.max);
    const velocityBuffer = properties.velocity;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * velocityBuffer.itemSize;
      velocityBuffer.array[itemOffset] = Math.cos(angle) * magnitude;
      velocityBuffer.array[itemOffset + 1] = Math.sin(angle) * magnitude;
    }

    velocityBuffer.needsUpdate = true;
  }
}

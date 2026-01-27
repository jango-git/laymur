import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorVelocityDamping extends UIBehaviorModule<{
  velocity: "Vector2";
}> {
  /** @internal */
  public readonly requiredProperties = { velocity: "Vector2" } as const;

  constructor(
    public readonly damping: { min: number; max: number },
    public threshold = 0,
  ) {
    super();
  }

  /** @internal */
  public update(
    properties: { velocity: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const velocity = properties.velocity;
    const thresholdSquared = this.threshold * this.threshold;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * velocity.itemSize;
      let vx = velocity.array[offset];
      let vy = velocity.array[offset + 1];

      const dampingValue = MathUtils.randFloat(this.damping.min, this.damping.max);
      const dampingFactor = Math.pow(1 - dampingValue, deltaTime);

      vx *= dampingFactor;
      vy *= dampingFactor;

      const magnitudeSquared = vx * vx + vy * vy;
      if (magnitudeSquared < thresholdSquared) {
        vx = 0;
        vy = 0;
      }

      velocity.array[offset] = vx;
      velocity.array[offset + 1] = vy;
    }

    velocity.needsUpdate = true;
  }
}

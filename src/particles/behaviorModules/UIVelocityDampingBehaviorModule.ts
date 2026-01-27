import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIVelocityDampingBehaviorModule extends UIBehaviorModule<{
  linearVelocity: "Vector2";
}> {
  public readonly requiredProperties = { linearVelocity: "Vector2" } as const;

  constructor(
    private readonly damping: { min: number; max: number },
    private readonly threshold = 0,
  ) {
    super();
  }

  public update(
    properties: { linearVelocity: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const linearVelocity = properties.linearVelocity;
    const thresholdSquared = this.threshold * this.threshold;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * linearVelocity.itemSize;
      let vx = linearVelocity.array[offset];
      let vy = linearVelocity.array[offset + 1];

      const dampingValue = MathUtils.randFloat(this.damping.min, this.damping.max);
      const dampingFactor = Math.pow(1 - dampingValue, deltaTime);

      vx *= dampingFactor;
      vy *= dampingFactor;

      const magnitudeSquared = vx * vx + vy * vy;
      if (magnitudeSquared < thresholdSquared) {
        vx = 0;
        vy = 0;
      }

      linearVelocity.array[offset] = vx;
      linearVelocity.array[offset + 1] = vy;
    }

    linearVelocity.needsUpdate = true;
  }
}

import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIAngularVelocityDampingBehaviorModule extends UIBehaviorModule<{
  angularVelocity: "number";
}> {
  public readonly requiredProperties = { angularVelocity: "number" } as const;

  constructor(
    private readonly damping: { min: number; max: number },
    private readonly threshold = 0,
  ) {
    super();
  }

  public update(
    properties: { angularVelocity: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const angularVelocity = properties.angularVelocity;
    const absThreshold = Math.abs(this.threshold);

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * angularVelocity.itemSize;
      let av = angularVelocity.array[offset];

      const dampingValue = MathUtils.randFloat(this.damping.min, this.damping.max);
      const dampingFactor = Math.pow(1 - dampingValue, deltaTime);

      av *= dampingFactor;

      if (Math.abs(av) < absThreshold) {
        av = 0;
      }

      angularVelocity.array[offset] = av;
    }

    angularVelocity.needsUpdate = true;
  }
}

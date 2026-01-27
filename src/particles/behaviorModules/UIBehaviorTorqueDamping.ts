import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorTorqueDamping extends UIBehaviorModule<{
  torque: "number";
}> {
  /** @internal */
  public readonly requiredProperties = { torque: "number" } as const;

  constructor(
    public readonly damping: { min: number; max: number },
    public readonly threshold = 0,
  ) {
    super();
  }

  /** @internal */
  public update(
    properties: { torque: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const torqueBuffer = properties.torque;
    const absThreshold = Math.abs(this.threshold);

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * torqueBuffer.itemSize;
      let torque = torqueBuffer.array[offset];

      const dampingValue = MathUtils.randFloat(this.damping.min, this.damping.max);
      const dampingFactor = Math.pow(1 - dampingValue, deltaTime);

      torque *= dampingFactor;

      if (Math.abs(torque) < absThreshold) {
        torque = 0;
      }

      torqueBuffer.array[offset] = torque;
    }

    torqueBuffer.needsUpdate = true;
  }
}

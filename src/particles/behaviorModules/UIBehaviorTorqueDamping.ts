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
    public readonly threshold = 0.001,
  ) {
    super();
  }

  /** @internal */
  public update(
    properties: { torque: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const { torque: torqueAttribute } = properties;
    const absThreshold = Math.abs(this.threshold);

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * torqueAttribute.itemSize;
      const { array: torqueArray } = torqueAttribute;

      const dampingValue = MathUtils.randFloat(this.damping.min, this.damping.max);
      const dampingFactor = Math.pow(1 - dampingValue, deltaTime);

      let newTorque = torqueArray[offset] * dampingFactor;
      if (Math.abs(newTorque) < absThreshold) {
        newTorque = 0;
      }

      torqueArray[offset] = newTorque;
    }

    torqueAttribute.needsUpdate = true;
  }
}

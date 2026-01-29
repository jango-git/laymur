import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import {
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
} from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorVelocityDamping extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;

  constructor(public readonly damping: { min: number; max: number }) {
    super();
  }

  /** @internal */
  public update(
    properties: { builtin: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;

      const dampingValue = MathUtils.randFloat(this.damping.min, this.damping.max);
      const dampingFactor = Math.pow(1 - dampingValue, deltaTime);

      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] *= dampingFactor;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] *= dampingFactor;
    }

    builtin.needsUpdate = true;
  }
}

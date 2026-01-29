import type { InstancedBufferAttribute } from "three";
import { BUILTIN_OFFSET_TORQUE } from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorTorqueDamping extends UIBehaviorModule<{
  builtin: "Matrix4";
}> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;

  constructor(public damping: number) {
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
    const invertedDamping = Math.max(1 - this.damping, 0);

    for (let i = 0; i < instanceCount; i++) {
      array[i * itemSize + BUILTIN_OFFSET_TORQUE] *= Math.pow(invertedDamping, deltaTime);
    }

    builtin.needsUpdate = true;
  }
}

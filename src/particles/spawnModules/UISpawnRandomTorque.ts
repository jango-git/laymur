import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import type { UIRange } from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomTorque extends UISpawnModule<{
  torque: "number";
}> {
  /** @internal */
  public readonly requiredProperties = { torque: "number" } as const;

  constructor(public readonly torque: UIRange = { min: -Math.PI, max: Math.PI }) {
    super();
  }

  /** @internal */
  public spawn(
    properties: { torque: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const torqueBuffer = properties.torque;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * torqueBuffer.itemSize;
      torqueBuffer.array[itemOffset] = MathUtils.randFloat(this.torque.min, this.torque.max);
    }

    torqueBuffer.needsUpdate = true;
  }
}

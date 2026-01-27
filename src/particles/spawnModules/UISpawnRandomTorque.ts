import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import {
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomTorque extends UISpawnModule<{
  torque: "number";
}> {
  /** @internal */
  public readonly requiredProperties = { torque: "number" } as const;
  private torqueInternal: UIRange;

  constructor(torque: UIRangeConfig = { min: -Math.PI, max: Math.PI }) {
    super();
    this.torqueInternal = resolveUIRangeConfig(torque);
  }

  public get torque(): UIRange {
    return this.torqueInternal;
  }

  public set torque(value: UIRangeConfig) {
    this.torqueInternal = resolveUIRangeConfig(value);
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
      torqueBuffer.array[itemOffset] = MathUtils.randFloat(
        this.torqueInternal.min,
        this.torqueInternal.max,
      );
    }

    torqueBuffer.needsUpdate = true;
  }
}

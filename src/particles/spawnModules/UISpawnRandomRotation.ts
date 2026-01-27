import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import {
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomRotation extends UISpawnModule<{ rotation: "number" }> {
  /** @internal */
  public requiredProperties = { rotation: "number" } as const;
  private rotationInternal: UIRange;

  constructor(rotation: UIRangeConfig = { min: -Math.PI, max: Math.PI }) {
    super();
    this.rotationInternal = resolveUIRangeConfig(rotation);
  }

  public get rotation(): UIRange {
    return this.rotationInternal;
  }

  public set rotation(value: UIRangeConfig) {
    this.rotationInternal = resolveUIRangeConfig(value);
  }

  /** @internal */
  public spawn(
    properties: { rotation: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const rotationBuffer = properties.rotation;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * rotationBuffer.itemSize;
      rotationBuffer.array[itemOffset] = MathUtils.randFloat(
        this.rotationInternal.min,
        this.rotationInternal.max,
      );
    }

    rotationBuffer.needsUpdate = true;
  }
}

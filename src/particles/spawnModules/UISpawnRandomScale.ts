import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import {
  resolveUIRangeParameter,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomScale extends UISpawnModule<{ scale: "Vector2" }> {
  /** @internal */
  public requiredProperties = { scale: "Vector2" } as const;
  private scaleInternal: UIRange;

  constructor(
    scale: UIRangeConfig = { min: 50, max: 100 },
    public aspect = 1,
  ) {
    super();
    this.scaleInternal = resolveUIRangeParameter(scale);
  }

  public get scale(): UIRange {
    return this.scaleInternal;
  }

  public set scale(scale: UIRangeConfig) {
    this.scaleInternal = resolveUIRangeParameter(scale);
  }

  /** @internal */
  public spawn(
    properties: { scale: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const scale = MathUtils.randFloat(this.scaleInternal.min, this.scaleInternal.max);
    const scaleBuffer = properties.scale;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * scaleBuffer.itemSize;
      scaleBuffer.array[itemOffset] = scale * this.aspect;
      scaleBuffer.array[itemOffset + 1] = scale;
    }

    scaleBuffer.needsUpdate = true;
  }
}

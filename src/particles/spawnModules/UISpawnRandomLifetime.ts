import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import type { UIRange, UIRangeConfig } from "../miscellaneous/miscellaneous";
import { resolveUIRangeParameter } from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomLifetime extends UISpawnModule<{ lifetime: "Vector2" }> {
  /** @internal */
  public override requiredProperties = { lifetime: "Vector2" } as const;
  private lifetimeInternal: UIRange;

  constructor(scale: UIRangeConfig = { min: 4, max: 8 }) {
    super();
    this.lifetimeInternal = resolveUIRangeParameter(scale);
  }

  public get lifetime(): UIRange {
    return this.lifetimeInternal;
  }

  public set lifetime(scale: UIRangeConfig) {
    this.lifetimeInternal = resolveUIRangeParameter(scale);
  }

  /** @internal */
  public spawn(
    properties: { lifetime: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const lifetimeBuffer = properties.lifetime;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * lifetimeBuffer.itemSize;
      lifetimeBuffer.array[itemOffset] = MathUtils.randFloat(this.lifetime.min, this.lifetime.max);
      lifetimeBuffer.array[itemOffset + 1] = 0;
    }

    lifetimeBuffer.needsUpdate = true;
  }
}

import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidPositiveNumber } from "../../core/miscellaneous/asserts";
import type { UIRange, UIRangeConfig } from "../miscellaneous/miscellaneous";
import { resolveUIRangeConfig } from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomLifetime extends UISpawnModule<{ lifetime: "Vector2" }> {
  /** @internal */
  public override requiredProperties = { lifetime: "Vector2" } as const;
  private lifetimeInternal: UIRange;

  constructor(lifetime: UIRangeConfig = { min: 4, max: 8 }) {
    super();
    this.lifetimeInternal = resolveUIRangeConfig(lifetime);
    assertValidPositiveNumber(
      this.lifetimeInternal.min,
      "UISpawnRandomLifetime.constructor.lifetime.min",
    );
    assertValidPositiveNumber(
      this.lifetimeInternal.max,
      "UISpawnRandomLifetime.constructor.lifetime.max",
    );
  }

  public get lifetime(): UIRange {
    return this.lifetimeInternal;
  }

  public set lifetime(value: UIRangeConfig) {
    this.lifetimeInternal = resolveUIRangeConfig(value);
    assertValidPositiveNumber(this.lifetimeInternal.min, "UISpawnRandomLifetime.lifetime.min");
    assertValidPositiveNumber(this.lifetimeInternal.max, "UISpawnRandomLifetime.lifetime.max");
  }

  /** @internal */
  public spawn(
    properties: { lifetime: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const { lifetime: lifetimeAttribute } = properties;
    const { itemSize: lifetimeItemSize, array: lifetimeArray } = lifetimeAttribute;
    const { min: lifetimeMin, max: lifetimeMax } = this.lifetimeInternal;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * lifetimeItemSize;
      lifetimeArray[itemOffset] = MathUtils.randFloat(lifetimeMin, lifetimeMax);
      lifetimeArray[itemOffset + 1] = 0;
    }

    lifetimeAttribute.needsUpdate = true;
  }
}

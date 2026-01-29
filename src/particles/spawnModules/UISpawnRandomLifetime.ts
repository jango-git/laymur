import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidPositiveNumber } from "../../core/miscellaneous/asserts";
import type { UIRange, UIRangeConfig } from "../miscellaneous/miscellaneous";
import {
  BUILTIN_OFFSET_AGE,
  BUILTIN_OFFSET_LIFETIME,
  resolveUIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

/**
 * Assigns random lifetime to particles.
 *
 * Lifetime is chosen uniformly from the specified range. Age is set to 0.
 */
export class UISpawnRandomLifetime extends UISpawnModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private lifetimeInternal: UIRange;

  /**
   * @param lifetime - Lifetime range in seconds. Accepts number, tuple, or range object
   */
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

  /** Lifetime range in seconds */
  public get lifetime(): UIRange {
    return this.lifetimeInternal;
  }

  /** Lifetime range in seconds */
  public set lifetime(value: UIRangeConfig) {
    this.lifetimeInternal = resolveUIRangeConfig(value);
    assertValidPositiveNumber(this.lifetimeInternal.min, "UISpawnRandomLifetime.lifetime.min");
    assertValidPositiveNumber(this.lifetimeInternal.max, "UISpawnRandomLifetime.lifetime.max");
  }

  /** @internal */
  public spawn(
    properties: { builtin: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { min: lifetimeMin, max: lifetimeMax } = this.lifetimeInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * itemSize;
      array[itemOffset + BUILTIN_OFFSET_LIFETIME] = MathUtils.randFloat(lifetimeMin, lifetimeMax);
      array[itemOffset + BUILTIN_OFFSET_AGE] = 0;
    }

    builtin.needsUpdate = true;
  }
}

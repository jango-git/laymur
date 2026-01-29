import { MathUtils, type InstancedBufferAttribute } from "three";
import { assertValidNonNegativeNumber } from "../../core/miscellaneous/asserts";
import {
  BUILTIN_OFFSET_RANDOM_E,
  BUILTIN_OFFSET_TORQUE,
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorTorqueDamping extends UIBehaviorModule<{
  builtin: "Matrix4";
}> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private dampingInternal: UIRange;

  constructor(damping: number) {
    super();
    this.dampingInternal = resolveUIRangeConfig(damping);
    assertValidNonNegativeNumber(
      this.dampingInternal.min,
      `UIBehaviorTorqueDamping.constructor.damping.min`,
    );
    assertValidNonNegativeNumber(
      this.dampingInternal.max,
      `UIBehaviorTorqueDamping.constructor.damping.max`,
    );
  }

  public get damping(): UIRange {
    return this.dampingInternal;
  }

  public set damping(value: UIRangeConfig) {
    this.dampingInternal = resolveUIRangeConfig(value);
    assertValidNonNegativeNumber(this.dampingInternal.min, `UIBehaviorTorqueDamping.damping.min`);
    assertValidNonNegativeNumber(this.dampingInternal.max, `UIBehaviorTorqueDamping.damping.max`);
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

      // Constant over the life of a particle but different for each particle
      const dampingT = array[itemOffset + BUILTIN_OFFSET_RANDOM_E];
      const dampingFactor = Math.pow(
        1 - MathUtils.lerp(this.dampingInternal.min, this.dampingInternal.max, dampingT),
        deltaTime,
      );
      array[itemOffset + BUILTIN_OFFSET_TORQUE] *= dampingFactor;
    }

    builtin.needsUpdate = true;
  }
}

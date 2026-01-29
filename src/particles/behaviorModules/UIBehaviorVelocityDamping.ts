import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidNonNegativeNumber } from "../../core/miscellaneous/asserts";
import {
  BUILTIN_OFFSET_RANDOM_B,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

/**
 * Reduces particle velocity over time.
 *
 * Applies exponential decay to velocity. Damping of 0 means no effect, 1 means instant stop.
 */
export class UIBehaviorVelocityDamping extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private dampingInternal: UIRange;

  /**
   * @param damping - Damping coefficient range (0-1). Accepts number, tuple, or range object
   */
  constructor(damping: UIRangeConfig) {
    super();
    this.dampingInternal = resolveUIRangeConfig(damping);
    assertValidNonNegativeNumber(
      this.dampingInternal.min,
      `UIBehaviorVelocityDamping.constructor.damping.min`,
    );
    assertValidNonNegativeNumber(
      this.dampingInternal.max,
      `UIBehaviorVelocityDamping.constructor.damping.max`,
    );
  }

  /** Damping coefficient range (0-1) */
  public get damping(): UIRange {
    return this.dampingInternal;
  }

  /** Damping coefficient range (0-1) */
  public set damping(value: UIRangeConfig) {
    this.dampingInternal = resolveUIRangeConfig(value);
    assertValidNonNegativeNumber(this.dampingInternal.min, `UIBehaviorVelocityDamping.damping.min`);
    assertValidNonNegativeNumber(this.dampingInternal.max, `UIBehaviorVelocityDamping.damping.max`);
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
      const dampingT = array[itemOffset + BUILTIN_OFFSET_RANDOM_B];
      const dampingFactor = Math.pow(
        1 - MathUtils.lerp(this.dampingInternal.min, this.dampingInternal.max, dampingT),
        deltaTime,
      );

      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] *= dampingFactor;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] *= dampingFactor;
    }

    builtin.needsUpdate = true;
  }
}

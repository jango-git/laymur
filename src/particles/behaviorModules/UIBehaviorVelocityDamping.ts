import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";

import type { UIRange, UIRangeConfig } from "../miscellaneous/miscellaneous.js";
import {
  assertValidUnitNumber,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  particleRandom,
  particleRandomStream,
  resolveUIRangeConfig,
} from "../miscellaneous/miscellaneous.js";
import { UIBehaviorModule } from "./UIBehaviorModule.js";

/**
 * Reduces particle velocity over time.
 *
 * Applies exponential decay to velocity. Damping of 0 means no effect, 1 means instant stop.
 */
export class UIBehaviorVelocityDamping extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private dampingInternal: UIRange;

  /**
   * @param damping - Damping coefficient range (0-1). Accepts number, tuple, or range object
   */
  constructor(damping: UIRangeConfig) {
    super();
    this.dampingInternal = resolveUIRangeConfig(damping);
    assertValidUnitNumber(
      this.dampingInternal.min,
      `UIBehaviorVelocityDamping.constructor.damping.min`,
    );
    assertValidUnitNumber(
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
    assertValidUnitNumber(this.dampingInternal.min, `UIBehaviorVelocityDamping.damping.min`);
    assertValidUnitNumber(this.dampingInternal.max, `UIBehaviorVelocityDamping.damping.max`);
  }

  public update(
    properties: { builtin: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
    randomSalt: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;

    const dampingStream = particleRandomStream(randomSalt, 0);

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;

      const dampingT = particleRandom(array, itemOffset, dampingStream);
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

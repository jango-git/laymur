import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";

import {
  assertValidNonNegativeNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts.js";
import type { UIRange, UIRangeConfig } from "../miscellaneous/miscellaneous.js";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_TORQUE,
  generateNoise2D,
  particleRandom,
  particleRandomStream,
  resolveUIRangeConfig,
} from "../miscellaneous/miscellaneous.js";
import { UIBehaviorModule } from "./UIBehaviorModule.js";

/**
 * Applies noise-based angular acceleration to particles.
 *
 * The noise is sampled at the particle position times scale, so 1 / scale is the size of a noise
 * detail in layer units; around 0.005 gives a smooth change over a few hundred units.
 */
export class UIBehaviorTorqueNoise extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private scaleInternal: UIRange;
  private strengthInternal: UIRange;

  /**
   * @param scale - Noise frequency range. Accepts number, tuple, or range object
   * @param strength - Force multiplier range. Accepts number, tuple, or range object
   */
  constructor(scale: UIRangeConfig, strength: UIRangeConfig) {
    super();
    this.scaleInternal = resolveUIRangeConfig(scale);
    assertValidPositiveNumber(
      this.scaleInternal.min,
      `UIBehaviorTorqueNoise.constructor.scale.min`,
    );
    assertValidPositiveNumber(
      this.scaleInternal.max,
      `UIBehaviorTorqueNoise.constructor.scale.max`,
    );

    this.strengthInternal = resolveUIRangeConfig(strength);
    assertValidNonNegativeNumber(
      this.strengthInternal.min,
      `UIBehaviorTorqueNoise.constructor.strength.min`,
    );
    assertValidNonNegativeNumber(
      this.strengthInternal.max,
      `UIBehaviorTorqueNoise.constructor.strength.max`,
    );
  }

  /** Noise frequency range */
  public get scale(): UIRange {
    return this.scaleInternal;
  }

  /** Force multiplier range */
  public get strength(): UIRange {
    return this.strengthInternal;
  }

  /** Noise frequency range */
  public set scale(value: UIRangeConfig) {
    this.scaleInternal = resolveUIRangeConfig(value);
    assertValidPositiveNumber(this.scaleInternal.min, `UIBehaviorTorqueNoise.scale.min`);
    assertValidPositiveNumber(this.scaleInternal.max, `UIBehaviorTorqueNoise.scale.max`);
  }

  /** Force multiplier range */
  public set strength(value: UIRangeConfig) {
    this.strengthInternal = resolveUIRangeConfig(value);
    assertValidNonNegativeNumber(this.strengthInternal.min, `UIBehaviorTorqueNoise.strength.min`);
    assertValidNonNegativeNumber(this.strengthInternal.max, `UIBehaviorTorqueNoise.strength.max`);
  }

  public update(
    properties: { builtin: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
    randomSalt: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;

    const scaleStream = particleRandomStream(randomSalt, 0);
    const strengthStream = particleRandomStream(randomSalt, 1);

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;

      const scaleT = particleRandom(array, itemOffset, scaleStream);
      const scale = MathUtils.lerp(this.scaleInternal.min, this.scaleInternal.max, scaleT);

      const noise = generateNoise2D(
        array[itemOffset + BUILTIN_OFFSET_POSITION_X] * scale,
        array[itemOffset + BUILTIN_OFFSET_POSITION_Y] * scale,
      );

      const strengthT = particleRandom(array, itemOffset, strengthStream);
      const strength = MathUtils.lerp(
        this.strengthInternal.min,
        this.strengthInternal.max,
        strengthT,
      );

      array[itemOffset + BUILTIN_OFFSET_TORQUE] += noise * strength * deltaTime;
    }

    builtin.needsUpdate = true;
  }
}

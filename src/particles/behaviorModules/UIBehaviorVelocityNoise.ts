import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";

import {
  assertValidNonNegativeNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts.js";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  generateNoise2D,
  particleRandom,
  particleRandomStream,
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous.js";
import { UIBehaviorModule } from "./UIBehaviorModule.js";

/**
 * Applies noise-based acceleration to particles: a still flow field that particles drift through.
 *
 * The noise is sampled at the particle position times scale, so 1 / scale is the size of a noise
 * detail in layer units. A detail much smaller than the distance a particle moves in a frame
 * turns the drift into jitter.
 */
export class UIBehaviorVelocityNoise extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private scaleInternal: UIRange;
  private strengthInternal: UIRange;

  /**
   * @param scale - Noise frequency range in 1 / layer units. Accepts number, tuple, or range object
   * @param strength - Force multiplier range. Accepts number, tuple, or range object
   */
  constructor(scale: UIRangeConfig = 0.005, strength: UIRangeConfig = 500) {
    super();
    this.scaleInternal = resolveUIRangeConfig(scale);
    assertValidPositiveNumber(
      this.scaleInternal.min,
      `UIBehaviorVelocityNoise.constructor.scale.min`,
    );
    assertValidPositiveNumber(
      this.scaleInternal.max,
      `UIBehaviorVelocityNoise.constructor.scale.max`,
    );

    this.strengthInternal = resolveUIRangeConfig(strength);
    assertValidNonNegativeNumber(
      this.strengthInternal.min,
      `UIBehaviorVelocityNoise.constructor.strength.min`,
    );
    assertValidNonNegativeNumber(
      this.strengthInternal.max,
      `UIBehaviorVelocityNoise.constructor.strength.max`,
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
    assertValidPositiveNumber(this.scaleInternal.min, `UIBehaviorVelocityNoise.scale.min`);
    assertValidPositiveNumber(this.scaleInternal.max, `UIBehaviorVelocityNoise.scale.max`);
  }

  /** Force multiplier range */
  public set strength(value: UIRangeConfig) {
    this.strengthInternal = resolveUIRangeConfig(value);
    assertValidNonNegativeNumber(this.strengthInternal.min, `UIBehaviorVelocityNoise.strength.min`);
    assertValidNonNegativeNumber(this.strengthInternal.max, `UIBehaviorVelocityNoise.strength.max`);
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

      const x = array[itemOffset + BUILTIN_OFFSET_POSITION_X];
      const y = array[itemOffset + BUILTIN_OFFSET_POSITION_Y];

      const scaleT = particleRandom(array, itemOffset, scaleStream);
      const scale = MathUtils.lerp(this.scaleInternal.min, this.scaleInternal.max, scaleT);

      const noiseX = generateNoise2D(x * scale, y * scale);
      const noiseY = generateNoise2D((x + 100) * scale, (y + 100) * scale);

      const strengthT = particleRandom(array, itemOffset, strengthStream);
      const strength = MathUtils.lerp(
        this.strengthInternal.min,
        this.strengthInternal.max,
        strengthT,
      );

      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] += noiseX * strength * deltaTime;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] += noiseY * strength * deltaTime;
    }

    builtin.needsUpdate = true;
  }
}

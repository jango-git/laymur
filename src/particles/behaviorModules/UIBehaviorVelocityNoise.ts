import { MathUtils, type InstancedBufferAttribute } from "three";
import {
  assertValidNonNegativeNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_RANDOM_C,
  BUILTIN_OFFSET_RANDOM_D,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  generateNoise2D,
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

/**
 * Applies noise-based acceleration to particles.
 *
 * Uses 2D noise based on particle position. Higher scale means finer noise detail.
 */
export class UIBehaviorVelocityNoise extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private scaleInternal: UIRange;
  private strengthInternal: UIRange;

  /**
   * @param scale - Noise frequency range. Accepts number, tuple, or range object
   * @param strength - Force multiplier range. Accepts number, tuple, or range object
   */
  constructor(scale = 100, strength = 500) {
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

      const x = array[itemOffset + BUILTIN_OFFSET_POSITION_X];
      const y = array[itemOffset + BUILTIN_OFFSET_POSITION_Y];

      // Constant over the life of a particle but different for each particle
      const scaleT = array[itemOffset + BUILTIN_OFFSET_RANDOM_C];
      const scale = MathUtils.lerp(this.scaleInternal.min, this.scaleInternal.max, scaleT);

      const noiseX = generateNoise2D(x * scale, y * scale);
      const noiseY = generateNoise2D((x + 100) * scale, (y + 100) * scale);

      // Constant over the life of a particle but different for each particle
      const strengthT = array[itemOffset + BUILTIN_OFFSET_RANDOM_D];
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

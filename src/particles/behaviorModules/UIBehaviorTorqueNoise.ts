import { MathUtils, type InstancedBufferAttribute } from "three";
import {
  assertValidNonNegativeNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_RANDOM_A,
  BUILTIN_OFFSET_RANDOM_F,
  BUILTIN_OFFSET_TORQUE,
  generateNoise2D,
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorTorqueNoise extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private scaleInternal: UIRange;
  private strengthInternal: UIRange;

  constructor(scale: number, strength: number) {
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

  public get scale(): UIRange {
    return this.scaleInternal;
  }

  public get strength(): UIRange {
    return this.strengthInternal;
  }

  public set scale(value: UIRangeConfig) {
    this.scaleInternal = resolveUIRangeConfig(value);
    assertValidPositiveNumber(this.scaleInternal.min, `UIBehaviorTorqueNoise.scale.min`);
    assertValidPositiveNumber(this.scaleInternal.max, `UIBehaviorTorqueNoise.scale.max`);
  }

  public set strength(value: UIRangeConfig) {
    this.strengthInternal = resolveUIRangeConfig(value);
    assertValidNonNegativeNumber(this.strengthInternal.min, `UIBehaviorTorqueNoise.strength.min`);
    assertValidNonNegativeNumber(this.strengthInternal.max, `UIBehaviorTorqueNoise.strength.max`);
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
      const scaleT = array[itemOffset + BUILTIN_OFFSET_RANDOM_F];
      const scale = MathUtils.lerp(this.scaleInternal.min, this.scaleInternal.max, scaleT);

      const noise = generateNoise2D(
        array[itemOffset + BUILTIN_OFFSET_POSITION_X] * scale,
        array[itemOffset + BUILTIN_OFFSET_POSITION_Y] * scale,
      );

      // Constant over the life of a particle but different for each particle
      const strengthT = array[itemOffset + BUILTIN_OFFSET_RANDOM_A];
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

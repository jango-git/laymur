import { MathUtils, type InstancedBufferAttribute } from "three";
import {
  assertValidNonNegativeNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts";
import {
  BUILTIN_OFFSET_AGE,
  BUILTIN_OFFSET_LIFETIME,
  BUILTIN_OFFSET_RANDOM_D,
  BUILTIN_OFFSET_SCALE_X,
  BUILTIN_OFFSET_SCALE_Y,
  resolveAspect,
  resolveUIRangeConfig,
  type UIAspectConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorScaleOverLife extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private readonly scales: UIRange[] = [];
  private aspectInternal: number;

  constructor(scales: UIRangeConfig[], aspect: UIAspectConfig = 1) {
    super();

    if (scales.length < 2) {
      throw new Error(
        "UIBehaviorScaleOverLife.scales: the number of scale anchors must be more than two",
      );
    }

    for (let i = 0; i < scales.length; i++) {
      const scale = resolveUIRangeConfig(scales[i]);
      assertValidNonNegativeNumber(
        scale.min,
        `UIBehaviorScaleOverLife.constructor.scales[${i}].min`,
      );
      assertValidNonNegativeNumber(
        scale.max,
        `UIBehaviorScaleOverLife.constructor.scales[${i}].max`,
      );
      this.scales.push(scale);
    }

    this.aspectInternal = resolveAspect(aspect);
    assertValidPositiveNumber(this.aspectInternal, "UIBehaviorScaleOverLife.constructor.aspect");
  }

  public get aspect(): number {
    return this.aspectInternal;
  }

  public set aspect(value: UIAspectConfig) {
    this.aspectInternal = resolveAspect(value);
    assertValidPositiveNumber(this.aspectInternal, "UIBehaviorScaleOverLife.aspect");
  }

  /** @internal */
  public update(properties: { builtin: InstancedBufferAttribute }, instanceCount: number): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;
      const lifeT = Math.min(
        array[itemOffset + BUILTIN_OFFSET_AGE] / array[itemOffset + BUILTIN_OFFSET_LIFETIME],
        1,
      );

      const segment = (this.scales.length - 1) * lifeT;
      const index = Math.floor(segment);

      // Constant over the life of a particle but different for each particle
      const scaleT = array[itemOffset + BUILTIN_OFFSET_RANDOM_D];

      const localT = segment - index;
      const scaleRange0 = this.scales[index];
      const scaleRange1 = this.scales[index + 1];
      const scale0 = MathUtils.lerp(scaleRange0.min, scaleRange0.max, scaleT);
      const scale1 = MathUtils.lerp(scaleRange1.min, scaleRange1.max, scaleT);

      const interpolatedScale = scale0 + (scale1 - scale0) * localT;

      array[itemOffset + BUILTIN_OFFSET_SCALE_X] = interpolatedScale * this.aspectInternal;
      array[itemOffset + BUILTIN_OFFSET_SCALE_Y] = interpolatedScale;
    }

    builtin.needsUpdate = true;
  }
}

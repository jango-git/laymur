import type { InstancedBufferAttribute } from "three";
import {
  assertValidNonNegativeNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts";
import {
  BUILTIN_OFFSET_AGE,
  BUILTIN_OFFSET_LIFETIME,
  BUILTIN_OFFSET_SCALE_X,
  BUILTIN_OFFSET_SCALE_Y,
  resolveAspect,
  type UIAspectConfig,
} from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorScaleOverLife extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private aspectInternal: number;

  constructor(
    private readonly scales: readonly number[],
    aspect: UIAspectConfig = 1,
  ) {
    super();

    if (scales.length < 2) {
      throw new Error(
        "UIBehaviorScaleOverLife.scales: the number of scale anchors must be more than two",
      );
    }

    for (let i = 0; i < scales.length; i++) {
      assertValidNonNegativeNumber(scales[i], `UIBehaviorScaleOverLife.constructor.scales[${i}]`);
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

      const localT = segment - index;
      const scale0 = this.scales[index];
      const scale1 = this.scales[index + 1];

      const interpolatedScale = scale0 + (scale1 - scale0) * localT;

      array[itemOffset + BUILTIN_OFFSET_SCALE_X] = interpolatedScale * this.aspectInternal;
      array[itemOffset + BUILTIN_OFFSET_SCALE_Y] = interpolatedScale;
    }

    builtin.needsUpdate = true;
  }
}

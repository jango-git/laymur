import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";

import {
  assertValidNonNegativeNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts.js";
import type { UIAspectConfig, UIRange, UIRangeConfig } from "../miscellaneous/miscellaneous.js";
import {
  applyEasing,
  BUILTIN_OFFSET_AGE,
  BUILTIN_OFFSET_LIFETIME,
  BUILTIN_OFFSET_SCALE_X,
  BUILTIN_OFFSET_SCALE_Y,
  particleRandom,
  particleRandomStream,
  resolveAspect,
  resolveUIRangeConfig,
  UIEasing,
} from "../miscellaneous/miscellaneous.js";
import { UIBehaviorModule } from "./UIBehaviorModule.js";

/**
 * Animates particle scale over lifetime.
 *
 * Interpolates between scale anchors based on particle age, with the easing within each span
 * between two anchors. Requires at least 2 anchors.
 */
export class UIBehaviorScaleOverLife extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  /** Easing within each span between two anchors */
  public easing: UIEasing;
  private readonly scales: UIRange[] = [];
  private aspectInternal: number;

  /**
   * @param scales - Scale anchor points. Each accepts number, tuple, or range object
   * @param aspect - Width/height ratio. Accepts number or texture
   * @param easing - Easing within each span between two anchors
   */
  constructor(
    scales: UIRangeConfig[],
    aspect: UIAspectConfig = 1,
    easing: UIEasing = UIEasing.LINEAR,
  ) {
    super();
    this.easing = easing;

    if (scales.length < 2) {
      throw new Error(
        `UIBehaviorScaleOverLife.constructor.scales: at least two scale anchors are required, got ${scales.length}`,
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

  /** Width/height aspect ratio */
  public get aspect(): number {
    return this.aspectInternal;
  }

  /** Width/height aspect ratio */
  public set aspect(value: UIAspectConfig) {
    this.aspectInternal = resolveAspect(value);
    assertValidPositiveNumber(this.aspectInternal, "UIBehaviorScaleOverLife.aspect");
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

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;
      const lifeT = Math.min(
        array[itemOffset + BUILTIN_OFFSET_AGE] / array[itemOffset + BUILTIN_OFFSET_LIFETIME],
        1,
      );

      const segment = (this.scales.length - 1) * lifeT;
      // The last span also takes lifeT = 1, of a particle that outlives its lifetime this frame
      const index = Math.min(Math.floor(segment), this.scales.length - 2);

      const scaleT = particleRandom(array, itemOffset, scaleStream);

      const localT = applyEasing(this.easing, segment - index);
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

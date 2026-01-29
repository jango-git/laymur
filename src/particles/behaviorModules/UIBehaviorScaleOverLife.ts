import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidPositiveNumber } from "../../core/miscellaneous/asserts";
import { resolveAspect, type UIAspectConfig } from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorScaleOverLife extends UIBehaviorModule<{
  scale: "Vector2";
  lifetime: "Vector2";
}> {
  /** @internal */
  public readonly requiredProperties = {
    scale: "Vector2",
    lifetime: "Vector2",
  } as const;
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
      assertValidPositiveNumber(scales[i], `UIBehaviorScaleOverLife.constructor.scales[${i}]`);
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
  public update(
    properties: { scale: InstancedBufferAttribute; lifetime: InstancedBufferAttribute },
    instanceCount: number,
  ): void {
    const { scale: scaleAttribute, lifetime: lifetimeAttribute } = properties;
    const { array: scaleArray, itemSize: scaleItemSize } = scaleAttribute;
    const { array: lifetimeArray, itemSize: lifetimeItemSize } = lifetimeAttribute;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * lifetimeItemSize;
      const t = MathUtils.clamp(lifetimeArray[offset + 1] / lifetimeArray[offset], 0, 1);

      const segment = (this.scales.length - 1) * t;
      const index = Math.floor(segment);

      const localT = segment - index;
      const scale0 = this.scales[index];
      const scale1 = this.scales[index + 1];

      const interpolatedScale = scale0 + (scale1 - scale0) * localT;

      const itemOffset = i * scaleItemSize;
      scaleArray[itemOffset] = interpolatedScale * this.aspectInternal;
      scaleArray[itemOffset + 1] = interpolatedScale;
    }

    scaleAttribute.needsUpdate = true;
  }
}

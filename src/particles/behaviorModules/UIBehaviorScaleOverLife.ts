import type { InstancedBufferAttribute } from "three";
import { MathUtils, Texture } from "three";
import type { UITextureConfig } from "../../core/miscellaneous/texture/UITextureView.Internal";
import type { UIAspectConfig } from "../miscellaneous/miscellaneous";
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
    private readonly scales: number[],
    aspect: UIAspectConfig = 1,
  ) {
    super();

    if (scales.length < 2) {
      throw new Error("UIBehaviorScaleOverLife.scales");
    }

    if (typeof aspect === "number") {
      this.aspectInternal = aspect;
    } else if (aspect instanceof Texture) {
      this.aspectInternal = aspect.image.naturalWidth / aspect.image.naturalHeight;
    } else {
      this.aspectInternal = aspect.sourceSize.w / aspect.sourceSize.h;
    }
  }

  public get aspect(): number {
    return this.aspectInternal;
  }

  public set aspect(value: number | UITextureConfig) {
    if (typeof value === "number") {
      this.aspectInternal = value;
    } else if (value instanceof Texture) {
      this.aspectInternal = value.image.naturalWidth / value.image.naturalHeight;
    } else {
      this.aspectInternal = value.sourceSize.w / value.sourceSize.h;
    }
  }

  /** @internal */
  public update(
    properties: { scale: InstancedBufferAttribute; lifetime: InstancedBufferAttribute },
    instanceCount: number,
  ): void {
    const { scale: scaleAttribute, lifetime: lifetimeAttribute } = properties;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * lifetimeAttribute.itemSize;
      const { array: lifetimeArray } = lifetimeAttribute;

      const t = MathUtils.clamp(lifetimeArray[offset + 1] / lifetimeArray[offset], 0, 1);
      let interpolatedScale = 0;

      if (t === 0) {
        interpolatedScale = this.scales[0];
      } else if (t === 1) {
        const lastElementIndex = this.scales.length - 1;
        interpolatedScale = this.scales[lastElementIndex];
      } else {
        const segment = (this.scales.length - 1) * t;
        const index = Math.floor(segment);

        const localT = segment - index;
        const scale0 = this.scales[index];
        const scale1 = this.scales[index + 1];

        interpolatedScale = scale0 + (scale1 - scale0) * localT;
      }

      const itemOffset = i * scaleAttribute.itemSize;
      const { array: scaleArray } = scaleAttribute;
      scaleArray[itemOffset] = interpolatedScale * this.aspectInternal;
      scaleArray[itemOffset + 1] = interpolatedScale;
    }

    scaleAttribute.needsUpdate = true;
  }
}

import type { InstancedBufferAttribute } from "three";
import { MathUtils, Texture } from "three";
import type { UITextureConfig } from "../../core/miscellaneous/texture/UITextureView.Internal";
import {
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomScale extends UISpawnModule<{ scale: "Vector2" }> {
  /** @internal */
  public requiredProperties = { scale: "Vector2" } as const;
  private scaleInternal: UIRange;
  private aspectInternal: number;

  constructor(scale: UIRangeConfig = { min: 50, max: 100 }, aspect: number | UITextureConfig = 1) {
    super();
    this.scaleInternal = resolveUIRangeConfig(scale);

    if (typeof aspect === "number") {
      this.aspectInternal = aspect;
    } else if (aspect instanceof Texture) {
      this.aspectInternal = aspect.image.naturalWidth / aspect.image.naturalHeight;
    } else {
      this.aspectInternal = aspect.sourceSize.w / aspect.sourceSize.h;
    }
  }

  public get scale(): UIRange {
    return this.scaleInternal;
  }

  public get aspect(): number {
    return this.aspectInternal;
  }

  public set scale(value: UIRangeConfig) {
    this.scaleInternal = resolveUIRangeConfig(value);
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
  public spawn(
    properties: { scale: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const scale = MathUtils.randFloat(this.scaleInternal.min, this.scaleInternal.max);
    const scaleBuffer = properties.scale;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * scaleBuffer.itemSize;
      scaleBuffer.array[itemOffset] = scale * this.aspectInternal;
      scaleBuffer.array[itemOffset + 1] = scale;
    }

    scaleBuffer.needsUpdate = true;
  }
}

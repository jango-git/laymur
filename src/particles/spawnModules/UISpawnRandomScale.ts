import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidPositiveNumber } from "../../core/miscellaneous/asserts";
import {
  resolveAspect,
  resolveUIRangeConfig,
  type UIAspectConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomScale extends UISpawnModule<{ scale: "Vector2" }> {
  /** @internal */
  public requiredProperties = { scale: "Vector2" } as const;
  private scaleInternal: UIRange;
  private aspectInternal: number;

  constructor(scale: UIRangeConfig = { min: 50, max: 100 }, aspect: UIAspectConfig = 1) {
    super();
    this.scaleInternal = resolveUIRangeConfig(scale);
    this.aspectInternal = resolveAspect(aspect);
    assertValidPositiveNumber(this.scaleInternal.min, "UISpawnRandomScale.constructor.scale.min");
    assertValidPositiveNumber(this.scaleInternal.max, "UISpawnRandomScale.constructor.scale.max");
    assertValidPositiveNumber(this.aspectInternal, "UISpawnRandomScale.constructor.aspect");
  }

  public get scale(): UIRange {
    return this.scaleInternal;
  }

  public get aspect(): number {
    return this.aspectInternal;
  }

  public set scale(value: UIRangeConfig) {
    this.scaleInternal = resolveUIRangeConfig(value);
    assertValidPositiveNumber(this.scaleInternal.min, "UISpawnRandomScale.scale.min");
    assertValidPositiveNumber(this.scaleInternal.max, "UISpawnRandomScale.scale.max");
  }

  public set aspect(value: UIAspectConfig) {
    this.aspectInternal = resolveAspect(value);
    assertValidPositiveNumber(this.aspectInternal, "UISpawnRandomScale.aspect");
  }

  /** @internal */
  public spawn(
    properties: { scale: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const { scale: scaleAttribute } = properties;
    const { itemSize: scaleItemSize, array: scaleArray } = scaleAttribute;
    const { min: scaleMin, max: scaleMax } = this.scaleInternal;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * scaleItemSize;
      const randomScale = MathUtils.randFloat(scaleMin, scaleMax);
      scaleArray[itemOffset] = randomScale * this.aspectInternal;
      scaleArray[itemOffset + 1] = randomScale;
    }

    scaleAttribute.needsUpdate = true;
  }
}

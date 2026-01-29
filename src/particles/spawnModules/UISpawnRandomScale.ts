import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidPositiveNumber } from "../../core/miscellaneous/asserts";
import {
  BUILTIN_OFFSET_SCALE_X,
  BUILTIN_OFFSET_SCALE_Y,
  resolveAspect,
  resolveUIRangeConfig,
  type UIAspectConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomScale extends UISpawnModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public requiredProperties = { builtin: "Matrix4" } as const;
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
    properties: { builtin: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { min: scaleMin, max: scaleMax } = this.scaleInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * itemSize;
      const randomScale = MathUtils.randFloat(scaleMin, scaleMax);
      array[itemOffset + BUILTIN_OFFSET_SCALE_X] = randomScale * this.aspectInternal;
      array[itemOffset + BUILTIN_OFFSET_SCALE_Y] = randomScale;
    }

    builtin.needsUpdate = true;
  }
}

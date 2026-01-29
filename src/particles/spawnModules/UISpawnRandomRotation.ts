import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import {
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomRotation extends UISpawnModule<{ rotation: "number" }> {
  /** @internal */
  public requiredProperties = { rotation: "number" } as const;
  private rotationInternal: UIRange;

  constructor(rotation: UIRangeConfig = { min: -Math.PI, max: Math.PI }) {
    super();
    this.rotationInternal = resolveUIRangeConfig(rotation);
    assertValidNumber(this.rotationInternal.min, "UISpawnRandomRotation.constructor.rotation.min");
    assertValidNumber(this.rotationInternal.max, "UISpawnRandomRotation.constructor.rotation.max");
  }

  public get rotation(): UIRange {
    return this.rotationInternal;
  }

  public set rotation(value: UIRangeConfig) {
    this.rotationInternal = resolveUIRangeConfig(value);
    assertValidNumber(this.rotationInternal.min, "UISpawnRandomRotation.rotation.min");
    assertValidNumber(this.rotationInternal.max, "UISpawnRandomRotation.rotation.max");
  }

  /** @internal */
  public spawn(
    properties: { rotation: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { rotation: rotationAttribute } = properties;
    const { itemSize: rotationItemSize, array: rotationArray } = rotationAttribute;
    const { min: rotationMin, max: rotationMax } = this.rotationInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * rotationItemSize;
      rotationArray[itemOffset] = MathUtils.randFloat(rotationMin, rotationMax);
    }

    rotationAttribute.needsUpdate = true;
  }
}

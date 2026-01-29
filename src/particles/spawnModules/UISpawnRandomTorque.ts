import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import {
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomTorque extends UISpawnModule<{
  torque: "number";
}> {
  /** @internal */
  public readonly requiredProperties = { torque: "number" } as const;
  private torqueInternal: UIRange;

  constructor(torque: UIRangeConfig = { min: -Math.PI, max: Math.PI }) {
    super();
    this.torqueInternal = resolveUIRangeConfig(torque);
    assertValidNumber(this.torqueInternal.min, "UISpawnRandomTorque.constructor.torque.min");
    assertValidNumber(this.torqueInternal.max, "UISpawnRandomTorque.constructor.torque.max");
  }

  public get torque(): UIRange {
    return this.torqueInternal;
  }

  public set torque(value: UIRangeConfig) {
    this.torqueInternal = resolveUIRangeConfig(value);
    assertValidNumber(this.torqueInternal.min, "UISpawnRandomTorque.torque.min");
    assertValidNumber(this.torqueInternal.max, "UISpawnRandomTorque.torque.max");
  }

  /** @internal */
  public spawn(
    properties: { torque: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { torque: torqueAttribute } = properties;
    const { itemSize: torqueItemSize, array: torqueArray } = torqueAttribute;
    const { min: torqueMin, max: torqueMax } = this.torqueInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * torqueItemSize;
      torqueArray[itemOffset] = MathUtils.randFloat(torqueMin, torqueMax);
    }

    torqueAttribute.needsUpdate = true;
  }
}

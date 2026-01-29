import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import {
  BUILTIN_OFFSET_TORQUE,
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

/**
 * Assigns random angular velocity to particles.
 *
 * Torque (rotation speed) is chosen uniformly from the specified range.
 */
export class UISpawnRandomTorque extends UISpawnModule<{
  builtin: "Matrix4";
}> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private torqueInternal: UIRange;

  /**
   * @param torque - Angular velocity range in radians/second. Accepts number, tuple, or range object
   */
  constructor(torque: UIRangeConfig = { min: -Math.PI, max: Math.PI }) {
    super();
    this.torqueInternal = resolveUIRangeConfig(torque);
    assertValidNumber(this.torqueInternal.min, "UISpawnRandomTorque.constructor.torque.min");
    assertValidNumber(this.torqueInternal.max, "UISpawnRandomTorque.constructor.torque.max");
  }

  /** Angular velocity range in radians/second */
  public get torque(): UIRange {
    return this.torqueInternal;
  }

  /** Angular velocity range in radians/second */
  public set torque(value: UIRangeConfig) {
    this.torqueInternal = resolveUIRangeConfig(value);
    assertValidNumber(this.torqueInternal.min, "UISpawnRandomTorque.torque.min");
    assertValidNumber(this.torqueInternal.max, "UISpawnRandomTorque.torque.max");
  }

  /** @internal */
  public spawn(
    properties: { builtin: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { min: torqueMin, max: torqueMax } = this.torqueInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      array[i * itemSize + BUILTIN_OFFSET_TORQUE] = MathUtils.randFloat(torqueMin, torqueMax);
    }

    builtin.needsUpdate = true;
  }
}

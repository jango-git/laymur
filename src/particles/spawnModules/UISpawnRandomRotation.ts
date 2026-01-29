import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import {
  BUILTIN_OFFSET_ROTATION,
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

/**
 * Assigns random rotation to particles.
 *
 * Initial rotation is chosen uniformly from the specified range.
 */
export class UISpawnRandomRotation extends UISpawnModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public requiredProperties = { builtin: "Matrix4" } as const;
  private rotationInternal: UIRange;

  /**
   * @param rotation - Rotation range in radians. Accepts number, tuple, or range object
   */
  constructor(rotation: UIRangeConfig = { min: -Math.PI, max: Math.PI }) {
    super();
    this.rotationInternal = resolveUIRangeConfig(rotation);
    assertValidNumber(this.rotationInternal.min, "UISpawnRandomRotation.constructor.rotation.min");
    assertValidNumber(this.rotationInternal.max, "UISpawnRandomRotation.constructor.rotation.max");
  }

  /** Rotation range in radians */
  public get rotation(): UIRange {
    return this.rotationInternal;
  }

  /** Rotation range in radians */
  public set rotation(value: UIRangeConfig) {
    this.rotationInternal = resolveUIRangeConfig(value);
    assertValidNumber(this.rotationInternal.min, "UISpawnRandomRotation.rotation.min");
    assertValidNumber(this.rotationInternal.max, "UISpawnRandomRotation.rotation.max");
  }

  /** @internal */
  public spawn(
    properties: { builtin: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { min: rotationMin, max: rotationMax } = this.rotationInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      array[i * itemSize + BUILTIN_OFFSET_ROTATION] = MathUtils.randFloat(rotationMin, rotationMax);
    }

    builtin.needsUpdate = true;
  }
}

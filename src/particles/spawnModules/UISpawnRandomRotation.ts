import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";

import { assertValidNumber } from "../../core/miscellaneous/asserts.js";
import type { UIRange, UIRangeConfig } from "../miscellaneous/miscellaneous.js";
import {
  BUILTIN_OFFSET_ROTATION,
  particleRandom,
  particleRandomStream,
  resolveUIRangeConfig,
} from "../miscellaneous/miscellaneous.js";
import { UISpawnModule } from "./UISpawnModule.js";

/**
 * Assigns random rotation to particles.
 *
 * Initial rotation is chosen uniformly from the specified range.
 */
export class UISpawnRandomRotation extends UISpawnModule<{ builtin: "Matrix4" }> {
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

  public spawn(
    properties: { builtin: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
    randomSalt: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { min: rotationMin, max: rotationMax } = this.rotationInternal;

    const rotationStream = particleRandomStream(randomSalt, 0);

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * itemSize;
      array[itemOffset + BUILTIN_OFFSET_ROTATION] = MathUtils.lerp(
        rotationMin,
        rotationMax,
        particleRandom(array, itemOffset, rotationStream),
      );
    }

    builtin.needsUpdate = true;
  }
}

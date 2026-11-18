import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";

import { assertValidNumber } from "../../core/miscellaneous/asserts.js";
import type { Vector2Like } from "../../core/miscellaneous/math.js";
import type { UIRange, UIRangeConfig, UIVector2Config } from "../miscellaneous/miscellaneous.js";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  particleRandom,
  particleRandomStream,
  resolveUIRangeConfig,
  resolveUIVector2Config,
} from "../miscellaneous/miscellaneous.js";
import { UISpawnModule } from "./UISpawnModule.js";

/**
 * Assigns velocity along the direction from a center to the spawn position: outward for a positive
 * speed, inward for a negative one.
 *
 * Reads the position, so it goes after the shape module in the spawn sequence. A particle at the
 * center moves in a random direction.
 */
export class UISpawnRadialVelocity extends UISpawnModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private magnitudeInternal: UIRange;
  private centerInternal: Vector2Like;

  /**
   * @param magnitude - Speed range in units/second. Accepts number, tuple, or range object
   * @param center - Center relative to the emitter
   */
  constructor(magnitude: UIRangeConfig = { min: 50, max: 100 }, center: UIVector2Config = 0) {
    super();
    this.magnitudeInternal = resolveUIRangeConfig(magnitude);
    this.centerInternal = resolveUIVector2Config(center);
    this.assertValid("UISpawnRadialVelocity.constructor");
  }

  /** Speed range in units/second */
  public get magnitude(): UIRange {
    return this.magnitudeInternal;
  }

  /** Center relative to the emitter */
  public get center(): Vector2Like {
    return this.centerInternal;
  }

  /** Speed range in units/second */
  public set magnitude(value: UIRangeConfig) {
    this.magnitudeInternal = resolveUIRangeConfig(value);
    this.assertValid("UISpawnRadialVelocity");
  }

  /** Center relative to the emitter */
  public set center(value: UIVector2Config) {
    this.centerInternal = resolveUIVector2Config(value);
    this.assertValid("UISpawnRadialVelocity");
  }

  public spawn(
    properties: { builtin: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
    randomSalt: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { min: magnitudeMin, max: magnitudeMax } = this.magnitudeInternal;
    const { x: centerX, y: centerY } = this.centerInternal;

    const magnitudeStream = particleRandomStream(randomSalt, 0);
    const angleStream = particleRandomStream(randomSalt, 1);

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * itemSize;
      const magnitude = MathUtils.lerp(
        magnitudeMin,
        magnitudeMax,
        particleRandom(array, itemOffset, magnitudeStream),
      );

      let directionX = array[itemOffset + BUILTIN_OFFSET_POSITION_X] - centerX;
      let directionY = array[itemOffset + BUILTIN_OFFSET_POSITION_Y] - centerY;
      const length = Math.hypot(directionX, directionY);
      if (length > 0) {
        directionX /= length;
        directionY /= length;
      } else {
        const angle = particleRandom(array, itemOffset, angleStream) * Math.PI * 2;
        directionX = Math.cos(angle);
        directionY = Math.sin(angle);
      }

      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] = directionX * magnitude;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] = directionY * magnitude;
    }

    builtin.needsUpdate = true;
  }

  private assertValid(subject: string): void {
    assertValidNumber(this.magnitudeInternal.min, `${subject}.magnitude.min`);
    assertValidNumber(this.magnitudeInternal.max, `${subject}.magnitude.max`);
    assertValidNumber(this.centerInternal.x, `${subject}.center.x`);
    assertValidNumber(this.centerInternal.y, `${subject}.center.y`);
  }
}

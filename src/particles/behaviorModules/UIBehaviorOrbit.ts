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
import { UIBehaviorModule } from "./UIBehaviorModule.js";

/**
 * Turns the motion of particles around a center: position and velocity rotate together at an
 * angular speed, so a particle at rest circles the center at its distance and one moving outward
 * spirals.
 *
 * The rotation is kinematic, not a force: the distance to the center stays unless the velocity
 * changes it. The center is in the particle space of the emitter.
 */
export class UIBehaviorOrbit extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private centerInternal: Vector2Like;
  private angularSpeedInternal: UIRange;

  /**
   * @param angularSpeed - Radians per second, counter-clockwise for positive values. Accepts
   * number, tuple, or range object
   * @param center - Center of the rotation
   */
  constructor(angularSpeed: UIRangeConfig, center: UIVector2Config = 0) {
    super();
    this.angularSpeedInternal = resolveUIRangeConfig(angularSpeed);
    this.centerInternal = resolveUIVector2Config(center);
    this.assertValid("UIBehaviorOrbit.constructor");
  }

  /** Radians per second, counter-clockwise for positive values */
  public get angularSpeed(): UIRange {
    return this.angularSpeedInternal;
  }

  /** Center of the rotation */
  public get center(): Vector2Like {
    return this.centerInternal;
  }

  /** Radians per second, counter-clockwise for positive values */
  public set angularSpeed(value: UIRangeConfig) {
    this.angularSpeedInternal = resolveUIRangeConfig(value);
    this.assertValid("UIBehaviorOrbit");
  }

  /** Center of the rotation */
  public set center(value: UIVector2Config) {
    this.centerInternal = resolveUIVector2Config(value);
    this.assertValid("UIBehaviorOrbit");
  }

  public update(
    properties: { builtin: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
    randomSalt: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { x: centerX, y: centerY } = this.centerInternal;
    const { min: speedMin, max: speedMax } = this.angularSpeedInternal;

    const speedStream = particleRandomStream(randomSalt, 0);

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;
      const angle =
        MathUtils.lerp(speedMin, speedMax, particleRandom(array, itemOffset, speedStream)) *
        deltaTime;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);

      const offsetX = array[itemOffset + BUILTIN_OFFSET_POSITION_X] - centerX;
      const offsetY = array[itemOffset + BUILTIN_OFFSET_POSITION_Y] - centerY;
      array[itemOffset + BUILTIN_OFFSET_POSITION_X] = centerX + offsetX * cos - offsetY * sin;
      array[itemOffset + BUILTIN_OFFSET_POSITION_Y] = centerY + offsetX * sin + offsetY * cos;

      const velocityX = array[itemOffset + BUILTIN_OFFSET_VELOCITY_X];
      const velocityY = array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y];
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] = velocityX * cos - velocityY * sin;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] = velocityX * sin + velocityY * cos;
    }

    builtin.needsUpdate = true;
  }

  private assertValid(subject: string): void {
    assertValidNumber(this.angularSpeedInternal.min, `${subject}.angularSpeed.min`);
    assertValidNumber(this.angularSpeedInternal.max, `${subject}.angularSpeed.max`);
    assertValidNumber(this.centerInternal.x, `${subject}.center.x`);
    assertValidNumber(this.centerInternal.y, `${subject}.center.y`);
  }
}

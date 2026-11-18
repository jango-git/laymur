import type { InstancedBufferAttribute } from "three";

import { assertValidNumber } from "../../core/miscellaneous/asserts.js";
import type { Vector2Like } from "../../core/miscellaneous/math.js";
import type { UIVector2Config } from "../miscellaneous/miscellaneous.js";
import {
  assertValidUnitNumber,
  BUILTIN_OFFSET_AGE,
  BUILTIN_OFFSET_LIFETIME,
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  resolveUIVector2Config,
} from "../miscellaneous/miscellaneous.js";
import { UIBehaviorModule } from "./UIBehaviorModule.js";

/**
 * Steers particles into a target point at the end of their life, such as coins flying into a
 * counter. With `UIEmitter.signalParticleDied` the death of a particle marks its arrival.
 *
 * Each frame the particle gets the constant acceleration that would bring it from its position and
 * velocity to the target in the life left, so it keeps its initial motion and curves into the
 * target. Put it last in the behavior sequence: modules after it move the particle off course.
 * The target is in the particle space of the emitter.
 */
export class UIBehaviorSeek extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private targetInternal: Vector2Like;
  private delayInternal: number;

  /**
   * @param target - Point the particles arrive at
   * @param delay - Part of the life before steering starts, from 0 to 1
   */
  constructor(target: UIVector2Config, delay = 0) {
    super();
    this.targetInternal = resolveUIVector2Config(target);
    assertValidNumber(this.targetInternal.x, "UIBehaviorSeek.constructor.target.x");
    assertValidNumber(this.targetInternal.y, "UIBehaviorSeek.constructor.target.y");
    assertValidUnitNumber(delay, "UIBehaviorSeek.constructor.delay");
    this.delayInternal = delay;
  }

  /** Point the particles arrive at */
  public get target(): Vector2Like {
    return this.targetInternal;
  }

  /** Part of the life before steering starts */
  public get delay(): number {
    return this.delayInternal;
  }

  /** Point the particles arrive at */
  public set target(value: UIVector2Config) {
    this.targetInternal = resolveUIVector2Config(value);
    assertValidNumber(this.targetInternal.x, "UIBehaviorSeek.target.x");
    assertValidNumber(this.targetInternal.y, "UIBehaviorSeek.target.y");
  }

  /** Part of the life before steering starts */
  public set delay(value: number) {
    assertValidUnitNumber(value, "UIBehaviorSeek.delay");
    this.delayInternal = value;
  }

  public update(
    properties: { builtin: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { x: targetX, y: targetY } = this.targetInternal;

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;
      const lifetime = array[itemOffset + BUILTIN_OFFSET_LIFETIME];
      const age = array[itemOffset + BUILTIN_OFFSET_AGE];
      if (age < lifetime * this.delayInternal) {
        continue;
      }

      const offsetX = targetX - array[itemOffset + BUILTIN_OFFSET_POSITION_X];
      const offsetY = targetY - array[itemOffset + BUILTIN_OFFSET_POSITION_Y];
      const timeLeft = lifetime - age;

      if (timeLeft <= deltaTime) {
        // The last frame of the life: the particle lands on the target at its end.
        array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] = offsetX / deltaTime;
        array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] = offsetY / deltaTime;
        continue;
      }

      // p + v * t + a * t^2 / 2 = target at t = timeLeft
      const velocityX = array[itemOffset + BUILTIN_OFFSET_VELOCITY_X];
      const velocityY = array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y];
      const scale = (2 * deltaTime) / (timeLeft * timeLeft);
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] += (offsetX - velocityX * timeLeft) * scale;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] += (offsetY - velocityY * timeLeft) * scale;
    }

    builtin.needsUpdate = true;
  }
}

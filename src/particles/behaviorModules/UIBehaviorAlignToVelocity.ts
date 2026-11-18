import type { InstancedBufferAttribute } from "three";

import {
  assertValidNonNegativeNumber,
  assertValidNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts.js";
import type { UIAspectConfig } from "../miscellaneous/miscellaneous.js";
import {
  BUILTIN_OFFSET_ROTATION,
  BUILTIN_OFFSET_SCALE_X,
  BUILTIN_OFFSET_SCALE_Y,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  resolveAspect,
} from "../miscellaneous/miscellaneous.js";
import { UIBehaviorModule } from "./UIBehaviorModule.js";

/**
 * Turns the X axis of particles along their velocity and stretches them along it with speed, as
 * motion blur of sparks and streaks.
 *
 * Sets the rotation every frame, so torque has no effect. The length is derived from the Y scale,
 * so the module composes with any scale source: put it after `UISpawnRandomScale` or
 * `UIBehaviorScaleOverLife` in the sequence. A particle at rest keeps its rotation.
 */
export class UIBehaviorAlignToVelocity extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private stretchInternal: number;
  private rotationOffsetInternal: number;
  private aspectInternal: number;

  /**
   * @param stretch - Seconds of motion added to the length: the length grows by speed * stretch
   * @param aspect - Width/height ratio at rest, the same as given to the scale module. Accepts
   * number or texture
   * @param rotationOffset - Angle in radians added to the direction, for sprites drawn along
   * another axis
   */
  constructor(stretch = 0, aspect: UIAspectConfig = 1, rotationOffset = 0) {
    super();
    this.stretchInternal = stretch;
    this.aspectInternal = resolveAspect(aspect);
    this.rotationOffsetInternal = rotationOffset;
    assertValidNonNegativeNumber(stretch, "UIBehaviorAlignToVelocity.constructor.stretch");
    assertValidPositiveNumber(this.aspectInternal, "UIBehaviorAlignToVelocity.constructor.aspect");
    assertValidNumber(rotationOffset, "UIBehaviorAlignToVelocity.constructor.rotationOffset");
  }

  /** Seconds of motion added to the length */
  public get stretch(): number {
    return this.stretchInternal;
  }

  /** Width/height aspect ratio at rest */
  public get aspect(): number {
    return this.aspectInternal;
  }

  /** Angle in radians added to the direction */
  public get rotationOffset(): number {
    return this.rotationOffsetInternal;
  }

  /** Seconds of motion added to the length */
  public set stretch(value: number) {
    assertValidNonNegativeNumber(value, "UIBehaviorAlignToVelocity.stretch");
    this.stretchInternal = value;
  }

  /** Width/height aspect ratio at rest */
  public set aspect(value: UIAspectConfig) {
    this.aspectInternal = resolveAspect(value);
    assertValidPositiveNumber(this.aspectInternal, "UIBehaviorAlignToVelocity.aspect");
  }

  /** Angle in radians added to the direction */
  public set rotationOffset(value: number) {
    assertValidNumber(value, "UIBehaviorAlignToVelocity.rotationOffset");
    this.rotationOffsetInternal = value;
  }

  public update(properties: { builtin: InstancedBufferAttribute }, instanceCount: number): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;
      const velocityX = array[itemOffset + BUILTIN_OFFSET_VELOCITY_X];
      const velocityY = array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y];
      const speed = Math.hypot(velocityX, velocityY);

      if (speed > 0) {
        array[itemOffset + BUILTIN_OFFSET_ROTATION] =
          Math.atan2(velocityY, velocityX) + this.rotationOffsetInternal;
      }
      array[itemOffset + BUILTIN_OFFSET_SCALE_X] =
        array[itemOffset + BUILTIN_OFFSET_SCALE_Y] * this.aspectInternal +
        speed * this.stretchInternal;
    }

    builtin.needsUpdate = true;
  }
}

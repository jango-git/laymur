import type { InstancedBufferAttribute } from "three";

import { assertValidNumber, assertValidUnitNumber } from "../../core/miscellaneous/asserts.js";
import type { Vector2Like } from "../../core/miscellaneous/math.js";
import type { UIVector2Config } from "../miscellaneous/miscellaneous.js";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  resolveUIVector2Config,
} from "../miscellaneous/miscellaneous.js";
import { UIBehaviorModule } from "./UIBehaviorModule.js";

/**
 * Keeps particles on one side of a line and bounces them off it, as a floor or a wall.
 *
 * The line passes through a point, and its normal points to the free side. A particle behind it
 * is put back on the line, the velocity into it is reflected and scaled by the restitution, and
 * the velocity along it decays by the friction while in contact, as `UIBehaviorVelocityDamping`
 * does. The point and the normal are in the particle space of the emitter.
 */
export class UIBehaviorBounce extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private pointInternal: Vector2Like;
  private normalX = 0;
  private normalY = 1;
  private restitutionInternal: number;
  private frictionInternal: number;

  /**
   * @param point - A point of the line
   * @param normal - Direction to the free side, normalized by the module
   * @param restitution - Share of the speed into the line kept after a bounce, from 0 to 1
   * @param friction - Share of the speed along the line lost per second of contact, from 0 to 1
   */
  constructor(
    point: UIVector2Config,
    normal: UIVector2Config = { x: 0, y: 1 },
    restitution = 0.5,
    friction = 0.9,
  ) {
    super();
    this.pointInternal = resolveUIVector2Config(point);
    assertValidNumber(this.pointInternal.x, "UIBehaviorBounce.constructor.point.x");
    assertValidNumber(this.pointInternal.y, "UIBehaviorBounce.constructor.point.y");
    this.setNormal(normal, "UIBehaviorBounce.constructor.normal");
    assertValidUnitNumber(restitution, "UIBehaviorBounce.constructor.restitution");
    assertValidUnitNumber(friction, "UIBehaviorBounce.constructor.friction");
    this.restitutionInternal = restitution;
    this.frictionInternal = friction;
  }

  /** A point of the line */
  public get point(): Vector2Like {
    return this.pointInternal;
  }

  /** Unit direction to the free side */
  public get normal(): Vector2Like {
    return { x: this.normalX, y: this.normalY };
  }

  /** Share of the speed into the line kept after a bounce */
  public get restitution(): number {
    return this.restitutionInternal;
  }

  /** Share of the speed along the line lost per second of contact */
  public get friction(): number {
    return this.frictionInternal;
  }

  /** A point of the line */
  public set point(value: UIVector2Config) {
    this.pointInternal = resolveUIVector2Config(value);
    assertValidNumber(this.pointInternal.x, "UIBehaviorBounce.point.x");
    assertValidNumber(this.pointInternal.y, "UIBehaviorBounce.point.y");
  }

  /** Direction to the free side, normalized by the module */
  public set normal(value: UIVector2Config) {
    this.setNormal(value, "UIBehaviorBounce.normal");
  }

  /** Share of the speed into the line kept after a bounce */
  public set restitution(value: number) {
    assertValidUnitNumber(value, "UIBehaviorBounce.restitution");
    this.restitutionInternal = value;
  }

  /** Share of the speed along the line lost per second of contact */
  public set friction(value: number) {
    assertValidUnitNumber(value, "UIBehaviorBounce.friction");
    this.frictionInternal = value;
  }

  public update(
    properties: { builtin: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { x: pointX, y: pointY } = this.pointInternal;
    const { normalX, normalY } = this;
    const keptAlong = Math.pow(1 - this.frictionInternal, deltaTime);

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;
      const depth =
        (array[itemOffset + BUILTIN_OFFSET_POSITION_X] - pointX) * normalX +
        (array[itemOffset + BUILTIN_OFFSET_POSITION_Y] - pointY) * normalY;
      if (depth >= 0) {
        continue;
      }

      array[itemOffset + BUILTIN_OFFSET_POSITION_X] -= normalX * depth;
      array[itemOffset + BUILTIN_OFFSET_POSITION_Y] -= normalY * depth;

      const velocityX = array[itemOffset + BUILTIN_OFFSET_VELOCITY_X];
      const velocityY = array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y];
      // Split into the parts across the line (normal * across) and along it
      const across = velocityX * normalX + velocityY * normalY;
      const alongX = velocityX - normalX * across;
      const alongY = velocityY - normalY * across;
      const acrossAfter = across < 0 ? -across * this.restitutionInternal : across;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] = alongX * keptAlong + normalX * acrossAfter;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] = alongY * keptAlong + normalY * acrossAfter;
    }

    builtin.needsUpdate = true;
  }

  private setNormal(value: UIVector2Config, subject: string): void {
    const { x, y } = resolveUIVector2Config(value);
    assertValidNumber(x, `${subject}.x`);
    assertValidNumber(y, `${subject}.y`);
    const length = Math.hypot(x, y);
    if (length === 0) {
      throw new Error(`${subject}: normal must not be zero`);
    }
    this.normalX = x / length;
    this.normalY = y / length;
  }
}

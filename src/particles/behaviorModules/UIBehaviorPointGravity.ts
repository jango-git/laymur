import type { InstancedBufferAttribute } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import type { Vector2Like } from "../../core/miscellaneous/math";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  resolveUIVector2Config,
  type UIVector2Config,
} from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorPointGravity extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private centerInternal: Vector2Like;

  constructor(
    center: Vector2Like,
    public strength: number,
    public exponent = 2,
    public threshold = 1,
  ) {
    super();
    this.centerInternal = resolveUIVector2Config(center);
    assertValidNumber(this.centerInternal.x, "UIBehaviorPointGravity.constructor.center.x");
    assertValidNumber(this.centerInternal.y, "UIBehaviorPointGravity.constructor.center.y");
  }

  public get center(): Vector2Like {
    return this.centerInternal;
  }

  public set center(value: UIVector2Config) {
    this.centerInternal = resolveUIVector2Config(value);
    assertValidNumber(this.centerInternal.x, "UIBehaviorPointGravity.center.x");
    assertValidNumber(this.centerInternal.y, "UIBehaviorPointGravity.center.y");
  }

  /** @internal */
  public update(
    properties: { builtin: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const thresholdSquared = this.threshold * this.threshold;

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;

      const dx = this.centerInternal.x - array[itemOffset + BUILTIN_OFFSET_POSITION_X];
      const dy = this.centerInternal.y - array[itemOffset + BUILTIN_OFFSET_POSITION_Y];

      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < thresholdSquared) {
        continue;
      }

      const distance = Math.sqrt(distanceSquared);
      const forceMagnitude = this.strength / Math.pow(distance, this.exponent);

      const directionX = dx / distance;
      const directionY = dy / distance;

      const accelerationX = directionX * forceMagnitude;
      const accelerationY = directionY * forceMagnitude;

      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] += accelerationX * deltaTime;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] += accelerationY * deltaTime;
    }

    builtin.needsUpdate = true;
  }
}

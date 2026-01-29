import type { InstancedBufferAttribute } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { resolveUIVector2Config, type UIVector2Config } from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorPointGravity extends UIBehaviorModule<{
  position: "Vector2";
  velocity: "Vector2";
}> {
  /** @internal */
  public readonly requiredProperties = { position: "Vector2", velocity: "Vector2" } as const;
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
    properties: { position: InstancedBufferAttribute; velocity: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const { position: positionAttribute, velocity: velocityAttribute } = properties;
    const { array: positionArray, itemSize: positionItemSize } = positionAttribute;
    const { array: velocityArray, itemSize: velocityItemSize } = velocityAttribute;
    const thresholdSquared = this.threshold * this.threshold;

    for (let i = 0; i < instanceCount; i++) {
      const positionOffset = i * positionItemSize;

      const dx = this.centerInternal.x - positionArray[positionOffset];
      const dy = this.centerInternal.y - positionArray[positionOffset + 1];

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

      const velocityOffset = i * velocityItemSize;
      velocityArray[velocityOffset] += accelerationX * deltaTime;
      velocityArray[velocityOffset + 1] += accelerationY * deltaTime;
    }

    velocityAttribute.needsUpdate = true;
  }
}

import type { InstancedBufferAttribute } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorPointGravity extends UIBehaviorModule<{
  position: "Vector2";
  velocity: "Vector2";
}> {
  /** @internal */
  public readonly requiredProperties = { position: "Vector2", velocity: "Vector2" } as const;

  constructor(
    public readonly center: Vector2Like,
    public strength: number,
    public exponent = 2,
  ) {
    super();
  }

  /** @internal */
  public update(
    properties: { position: InstancedBufferAttribute; velocity: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const { position: positionAttribute, velocity: velocityAttribute } = properties;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * positionAttribute.itemSize;
      const { array: positionArray } = positionAttribute;

      const dx = this.center.x - positionArray[offset];
      const dy = this.center.y - positionArray[offset + 1];

      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < 1) {
        continue;
      }

      const distance = Math.sqrt(distanceSquared);
      const forceMagnitude = this.strength / Math.pow(distance, this.exponent);

      const directionX = dx / distance;
      const directionY = dy / distance;

      const accelerationX = directionX * forceMagnitude;
      const accelerationY = directionY * forceMagnitude;

      const { array: velocityArray } = velocityAttribute;
      velocityArray[offset] += accelerationX * deltaTime;
      velocityArray[offset + 1] += accelerationY * deltaTime;
    }

    velocityAttribute.needsUpdate = true;
  }
}

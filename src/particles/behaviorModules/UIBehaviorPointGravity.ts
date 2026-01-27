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
    const position = properties.position;
    const velocity = properties.velocity;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * position.itemSize;

      const px = position.array[offset];
      const py = position.array[offset + 1];

      const dx = this.center.x - px;
      const dy = this.center.y - py;

      const distanceSquared = dx * dx + dy * dy;
      const distance = Math.sqrt(distanceSquared);

      if (distance < 1) {
        continue;
      }

      const forceMagnitude = this.strength / Math.pow(distance, this.exponent);

      const dirX = dx / distance;
      const dirY = dy / distance;

      const accelerationX = dirX * forceMagnitude;
      const accelerationY = dirY * forceMagnitude;

      velocity.array[offset] += accelerationX * deltaTime;
      velocity.array[offset + 1] += accelerationY * deltaTime;
    }

    velocity.needsUpdate = true;
  }
}

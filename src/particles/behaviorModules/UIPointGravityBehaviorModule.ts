import type { InstancedBufferAttribute } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIPointGravityBehaviorModule extends UIBehaviorModule<{
  position: "Vector2";
  linearVelocity: "Vector2";
}> {
  public readonly requiredProperties = { position: "Vector2", linearVelocity: "Vector2" } as const;

  constructor(
    private readonly center: Vector2Like,
    private readonly strength: number,
    private readonly exponent = 2,
  ) {
    super();
  }

  public update(
    properties: { position: InstancedBufferAttribute; linearVelocity: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const position = properties.position;
    const linearVelocity = properties.linearVelocity;

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

      linearVelocity.array[offset] += accelerationX * deltaTime;
      linearVelocity.array[offset + 1] += accelerationY * deltaTime;
    }

    linearVelocity.needsUpdate = true;
  }
}

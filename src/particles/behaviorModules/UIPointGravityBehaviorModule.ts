import type { InstancedBufferAttribute } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIPointGravityBehaviorModule extends UIBehaviorModule<{
  position: "Vector2";
  velocity: "Vector2";
}> {
  public readonly requiredProperties = { position: "Vector2", velocity: "Vector2" } as const;

  constructor(
    private readonly center: Vector2Like,
    private readonly strength: number,
    private readonly exponent = 2,
  ) {
    super();
  }

  public update(
    properties: { position: InstancedBufferAttribute; velocity: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const position = properties.position;
    const velocity = properties.velocity;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * position.itemSize;

      // Get particle position
      const px = position.array[offset];
      const py = position.array[offset + 1];

      // Calculate vector from particle to gravity center
      const dx = this.center.x - px;
      const dy = this.center.y - py;

      // Calculate distance
      const distanceSquared = dx * dx + dy * dy;
      const distance = Math.sqrt(distanceSquared);

      // Avoid division by zero and singularity at center
      if (distance < 1) {
        continue;
      }

      // Calculate gravity force magnitude using power law
      // F = strength / distance^exponent
      const forceMagnitude = this.strength / Math.pow(distance, this.exponent);

      // Calculate normalized direction
      const dirX = dx / distance;
      const dirY = dy / distance;

      // Apply force to velocity (F = ma, assuming m = 1)
      const accelerationX = dirX * forceMagnitude;
      const accelerationY = dirY * forceMagnitude;

      velocity.array[offset] += accelerationX * deltaTime;
      velocity.array[offset + 1] += accelerationY * deltaTime;
    }

    velocity.needsUpdate = true;
  }
}

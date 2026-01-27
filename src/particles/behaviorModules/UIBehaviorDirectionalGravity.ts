import type { InstancedBufferAttribute } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorDirectionalGravity extends UIBehaviorModule<{ velocity: "Vector2" }> {
  /** @internal */
  public readonly requiredProperties = { velocity: "Vector2" } as const;

  constructor(public readonly direction: Vector2Like) {
    super();
  }

  /** @internal */
  public update(
    properties: { velocity: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const velocity = properties.velocity;

    const offsetX = this.direction.x * deltaTime;
    const offsetY = this.direction.y * deltaTime;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * velocity.itemSize;
      velocity.array[offset] += offsetX;
      velocity.array[offset + 1] += offsetY;
    }

    velocity.needsUpdate = true;
  }
}

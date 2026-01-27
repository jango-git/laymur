import type { InstancedBufferAttribute } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIGravityBehaviorModule extends UIBehaviorModule<{ linearVelocity: "Vector2" }> {
  public readonly requiredProperties = { linearVelocity: "Vector2" } as const;

  constructor(private readonly direction: Vector2Like) {
    super();
  }

  public update(
    properties: { linearVelocity: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const linearVelocity = properties.linearVelocity;

    const offsetX = this.direction.x * deltaTime;
    const offsetY = this.direction.y * deltaTime;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * linearVelocity.itemSize;
      linearVelocity.array[offset] += offsetX;
      linearVelocity.array[offset + 1] += offsetY;
    }

    linearVelocity.needsUpdate = true;
  }
}

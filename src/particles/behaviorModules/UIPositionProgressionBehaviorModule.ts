import type { InstancedBufferAttribute } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIPositionProgressionBehaviorModule extends UIBehaviorModule<{
  position: "Vector2";
  velocity: "Vector2";
}> {
  public readonly requiredProperties = {
    position: "Vector2",
    velocity: "Vector2",
  } as const;

  public update(
    properties: {
      position: InstancedBufferAttribute;
      velocity: InstancedBufferAttribute;
    },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const position = properties.position;
    const velocity = properties.velocity;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * position.itemSize;
      position.array[offset] += velocity.array[offset] * deltaTime;
      position.array[offset + 1] += velocity.array[offset + 1] * deltaTime;
    }

    position.needsUpdate = true;
    velocity.needsUpdate = true;
  }
}

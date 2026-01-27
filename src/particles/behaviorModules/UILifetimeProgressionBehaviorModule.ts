import type { InstancedBufferAttribute } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UILifetimeProgressionBehaviorModule extends UIBehaviorModule<{
  lifetime: "Vector2";
}> {
  public readonly requiredProperties = { lifetime: "Vector2" } as const;

  public update(
    properties: { lifetime: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const lifetime = properties.lifetime;

    for (let i = 0; i < instanceCount; i++) {
      const offset = i * lifetime.itemSize;
      lifetime.array[offset + 1] += deltaTime;
    }

    lifetime.needsUpdate = true;
  }
}

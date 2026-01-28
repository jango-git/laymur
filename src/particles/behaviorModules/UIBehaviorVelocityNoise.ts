import type { InstancedBufferAttribute } from "three";
import { generateNoise2D } from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorVelocityNoise extends UIBehaviorModule<{
  position: "Vector2";
  velocity: "Vector2";
}> {
  /** @internal */
  public readonly requiredProperties = {
    position: "Vector2",
    velocity: "Vector2",
  } as const;

  constructor(
    public scale = 100,
    public strength = 500,
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
      const positionOffset = i * positionAttribute.itemSize;
      const velocityOffset = i * velocityAttribute.itemSize;
      const { array: positionArray } = positionAttribute;
      const { array: velocityArray } = velocityAttribute;

      const x = positionArray[positionOffset];
      const y = positionArray[positionOffset + 1];

      const noiseX = generateNoise2D(x * this.scale, y * this.scale);
      const noiseY = generateNoise2D((x + 100) * this.scale, (y + 100) * this.scale);

      velocityArray[velocityOffset] += noiseX * this.strength * deltaTime;
      velocityArray[velocityOffset + 1] += noiseY * this.strength * deltaTime;
    }

    velocityAttribute.needsUpdate = true;
  }
}

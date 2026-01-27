import type { InstancedBufferAttribute } from "three";
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
      const posOffset = i * position.itemSize;
      const velOffset = i * velocity.itemSize;

      const x = position.array[posOffset];
      const y = position.array[posOffset + 1];

      const noiseX = this.noise2D(x * this.scale, y * this.scale);
      const noiseY = this.noise2D((x + 100) * this.scale, (y + 100) * this.scale);

      const forceX = noiseX * this.strength;
      const forceY = noiseY * this.strength;

      velocity.array[velOffset] += forceX * deltaTime;
      velocity.array[velOffset + 1] += forceY * deltaTime;
    }

    velocity.needsUpdate = true;
  }

  /** @internal */
  private noise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return (n - Math.floor(n)) * 2 - 1;
  }
}

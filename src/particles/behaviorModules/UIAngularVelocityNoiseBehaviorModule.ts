import type { InstancedBufferAttribute } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIAngularVelocityNoiseBehaviorModule extends UIBehaviorModule<{
  position: "Vector2";
  angularVelocity: "number";
}> {
  public readonly requiredProperties = {
    position: "Vector2",
    angularVelocity: "number",
  } as const;

  constructor(
    private readonly scale: number,
    private readonly strength: number,
  ) {
    super();
  }

  public update(
    properties: {
      position: InstancedBufferAttribute;
      angularVelocity: InstancedBufferAttribute;
    },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const position = properties.position;
    const angularVelocity = properties.angularVelocity;

    for (let i = 0; i < instanceCount; i++) {
      const posOffset = i * position.itemSize;
      const avOffset = i * angularVelocity.itemSize;

      const x = position.array[posOffset];
      const y = position.array[posOffset + 1];

      // Simple noise based on position
      const noise = this.noise2D(x * this.scale, y * this.scale);

      // Apply noise force
      const force = noise * this.strength;

      angularVelocity.array[avOffset] += force * deltaTime;
    }

    angularVelocity.needsUpdate = true;
  }

  // Simple 2D noise function (Perlin-like)
  private noise2D(x: number, y: number): number {
    // Simple hash-based noise
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return (n - Math.floor(n)) * 2 - 1;
  }
}

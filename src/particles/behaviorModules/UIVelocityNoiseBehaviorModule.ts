import type { InstancedBufferAttribute } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIVelocityNoiseBehaviorModule extends UIBehaviorModule<{
  position: "Vector2";
  linearVelocity: "Vector2";
}> {
  public readonly requiredProperties = {
    position: "Vector2",
    linearVelocity: "Vector2",
  } as const;

  constructor(
    private readonly scale = 100,
    private readonly strength = 500,
  ) {
    super();
  }

  public update(
    properties: {
      position: InstancedBufferAttribute;
      linearVelocity: InstancedBufferAttribute;
    },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const position = properties.position;
    const linearVelocity = properties.linearVelocity;

    for (let i = 0; i < instanceCount; i++) {
      const posOffset = i * position.itemSize;
      const velOffset = i * linearVelocity.itemSize;

      const x = position.array[posOffset];
      const y = position.array[posOffset + 1];

      const noiseX = this.noise2D(x * this.scale, y * this.scale);
      const noiseY = this.noise2D((x + 100) * this.scale, (y + 100) * this.scale);

      const forceX = noiseX * this.strength;
      const forceY = noiseY * this.strength;

      linearVelocity.array[velOffset] += forceX * deltaTime;
      linearVelocity.array[velOffset + 1] += forceY * deltaTime;
    }

    linearVelocity.needsUpdate = true;
  }

  private noise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return (n - Math.floor(n)) * 2 - 1;
  }
}

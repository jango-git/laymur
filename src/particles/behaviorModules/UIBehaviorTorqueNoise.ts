import type { InstancedBufferAttribute } from "three";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorTorqueNoise extends UIBehaviorModule<{
  position: "Vector2";
  torque: "number";
}> {
  /** @internal */
  public readonly requiredProperties = {
    position: "Vector2",
    torque: "number",
  } as const;

  constructor(
    public readonly scale: number,
    public readonly strength: number,
  ) {
    super();
  }

  /** @internal */
  public update(
    properties: {
      position: InstancedBufferAttribute;
      torque: InstancedBufferAttribute;
    },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const position = properties.position;
    const torque = properties.torque;

    for (let i = 0; i < instanceCount; i++) {
      const posOffset = i * position.itemSize;
      const avOffset = i * torque.itemSize;

      const x = position.array[posOffset];
      const y = position.array[posOffset + 1];

      const noise = this.noise2D(x * this.scale, y * this.scale);

      const force = noise * this.strength;

      torque.array[avOffset] += force * deltaTime;
    }

    torque.needsUpdate = true;
  }

  private noise2D(x: number, y: number): number {
    const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
    return (n - Math.floor(n)) * 2 - 1;
  }
}

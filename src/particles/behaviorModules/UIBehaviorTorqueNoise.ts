import type { InstancedBufferAttribute } from "three";
import { generateNoise2D } from "../miscellaneous/miscellaneous";
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
    const { position: positionAttribute, torque: torqueAttribute } = properties;

    for (let i = 0; i < instanceCount; i++) {
      const positionOffset = i * positionAttribute.itemSize;
      const torqueOffset = i * torqueAttribute.itemSize;
      const { array: positionArray } = positionAttribute;

      const noise = generateNoise2D(
        positionArray[positionOffset] * this.scale,
        positionArray[positionOffset + 1] * this.scale,
      );
      const force = noise * this.strength;
      torqueAttribute.array[torqueOffset] += force * deltaTime;
    }

    torqueAttribute.needsUpdate = true;
  }
}

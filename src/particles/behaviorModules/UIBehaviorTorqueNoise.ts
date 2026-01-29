import type { InstancedBufferAttribute } from "three";
import { BUILTIN_OFFSET_TORQUE, generateNoise2D } from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorTorqueNoise extends UIBehaviorModule<{
  position: "Vector2";
  builtin: "Matrix4";
}> {
  /** @internal */
  public readonly requiredProperties = {
    position: "Vector2",
    builtin: "Matrix4",
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
      builtin: InstancedBufferAttribute;
    },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const { builtin, position: positionAttribute } = properties;
    const { array, itemSize } = builtin;
    const { array: positionArray, itemSize: positionItemSize } = positionAttribute;

    for (let i = 0; i < instanceCount; i++) {
      const positionOffset = i * positionItemSize;
      const noise = generateNoise2D(
        positionArray[positionOffset] * this.scale,
        positionArray[positionOffset + 1] * this.scale,
      );
      array[i * itemSize + BUILTIN_OFFSET_TORQUE] += noise * this.strength * deltaTime;
    }

    builtin.needsUpdate = true;
  }
}

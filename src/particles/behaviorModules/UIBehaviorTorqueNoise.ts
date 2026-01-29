import type { InstancedBufferAttribute } from "three";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_TORQUE,
  generateNoise2D,
} from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorTorqueNoise extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;

  constructor(
    public readonly scale: number,
    public readonly strength: number,
  ) {
    super();
  }

  /** @internal */
  public update(
    properties: { builtin: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;
      const noise = generateNoise2D(
        array[itemOffset + BUILTIN_OFFSET_POSITION_X] * this.scale,
        array[itemOffset + BUILTIN_OFFSET_POSITION_Y] * this.scale,
      );
      array[itemOffset + BUILTIN_OFFSET_TORQUE] += noise * this.strength * deltaTime;
    }

    builtin.needsUpdate = true;
  }
}

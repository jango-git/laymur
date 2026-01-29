import type { InstancedBufferAttribute } from "three";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  generateNoise2D,
} from "../miscellaneous/miscellaneous";
import { UIBehaviorModule } from "./UIBehaviorModule";

export class UIBehaviorVelocityNoise extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;

  constructor(
    public scale = 100,
    public strength = 500,
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

      const x = array[itemOffset + BUILTIN_OFFSET_POSITION_X];
      const y = array[itemOffset + BUILTIN_OFFSET_POSITION_Y];

      const noiseX = generateNoise2D(x * this.scale, y * this.scale);
      const noiseY = generateNoise2D((x + 100) * this.scale, (y + 100) * this.scale);

      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] += noiseX * this.strength * deltaTime;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] += noiseY * this.strength * deltaTime;
    }

    builtin.needsUpdate = true;
  }
}

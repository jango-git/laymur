import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import {
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

export class UISpawnRandomVelocity extends UISpawnModule<{ velocity: "Vector2" }> {
  /** @internal */
  public readonly requiredProperties = { velocity: "Vector2" } as const;
  private angleInternal: UIRange;
  private magnitudeInternal: UIRange;

  constructor(
    angle: UIRangeConfig = { min: -Math.PI, max: Math.PI },
    magnitude: UIRangeConfig = { min: -50, max: 50 },
  ) {
    super();
    this.angleInternal = resolveUIRangeConfig(angle);
    this.magnitudeInternal = resolveUIRangeConfig(magnitude);
  }

  public get angle(): UIRange {
    return this.angleInternal;
  }

  public get magnitude(): UIRange {
    return this.magnitudeInternal;
  }

  public set angle(value: UIRangeConfig) {
    this.angleInternal = resolveUIRangeConfig(value);
  }

  public set magnitude(value: UIRangeConfig) {
    this.magnitudeInternal = resolveUIRangeConfig(value);
  }

  /** @internal */
  public spawn(
    properties: { velocity: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void {
    const angle = MathUtils.randFloat(this.angleInternal.min, this.angleInternal.max);
    const magnitude = MathUtils.randFloat(this.magnitudeInternal.min, this.magnitudeInternal.max);
    const velocityBuffer = properties.velocity;

    for (let i = instanceOffset; i < instanceCount; i++) {
      const itemOffset = i * velocityBuffer.itemSize;
      velocityBuffer.array[itemOffset] = Math.cos(angle) * magnitude;
      velocityBuffer.array[itemOffset + 1] = Math.sin(angle) * magnitude;
    }

    velocityBuffer.needsUpdate = true;
  }
}

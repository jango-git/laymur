import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
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
    assertValidNumber(this.angleInternal.min, "UISpawnRandomVelocity.constructor.angle.min");
    assertValidNumber(this.angleInternal.max, "UISpawnRandomVelocity.constructor.angle.max");
    assertValidNumber(
      this.magnitudeInternal.min,
      "UISpawnRandomVelocity.constructor.magnitude.min",
    );
    assertValidNumber(
      this.magnitudeInternal.max,
      "UISpawnRandomVelocity.constructor.magnitude.max",
    );
  }

  public get angle(): UIRange {
    return this.angleInternal;
  }

  public get magnitude(): UIRange {
    return this.magnitudeInternal;
  }

  public set angle(value: UIRangeConfig) {
    this.angleInternal = resolveUIRangeConfig(value);
    assertValidNumber(this.angleInternal.min, "UISpawnRandomVelocity.angle.min");
    assertValidNumber(this.angleInternal.max, "UISpawnRandomVelocity.angle.max");
  }

  public set magnitude(value: UIRangeConfig) {
    this.magnitudeInternal = resolveUIRangeConfig(value);
    assertValidNumber(this.magnitudeInternal.min, "UISpawnRandomVelocity.magnitude.min");
    assertValidNumber(this.magnitudeInternal.max, "UISpawnRandomVelocity.magnitude.max");
  }

  /** @internal */
  public spawn(
    properties: { velocity: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { velocity: velocityAttribute } = properties;
    const { itemSize: velocityItemSize, array: velocityArray } = velocityAttribute;
    const { min: angleMin, max: angleMax } = this.angleInternal;
    const { min: magnitudeMin, max: magnitudeMax } = this.magnitudeInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * velocityItemSize;
      const angle = MathUtils.randFloat(angleMin, angleMax);
      const magnitude = MathUtils.randFloat(magnitudeMin, magnitudeMax);
      velocityArray[itemOffset] = Math.cos(angle) * magnitude;
      velocityArray[itemOffset + 1] = Math.sin(angle) * magnitude;
    }

    velocityAttribute.needsUpdate = true;
  }
}

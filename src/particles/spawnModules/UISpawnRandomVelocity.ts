import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import { assertValidNumber } from "../../core/miscellaneous/asserts";
import {
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  resolveUIRangeConfig,
  type UIRange,
  type UIRangeConfig,
} from "../miscellaneous/miscellaneous";
import { UISpawnModule } from "./UISpawnModule";

/**
 * Assigns random velocity to particles.
 *
 * Direction and magnitude are chosen independently from their respective ranges.
 */
export class UISpawnRandomVelocity extends UISpawnModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private angleInternal: UIRange;
  private magnitudeInternal: UIRange;

  /**
   * @param angle - Direction range in radians. Accepts number, tuple, or range object
   * @param magnitude - Speed range in units/second. Accepts number, tuple, or range object
   */
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

  /** Direction range in radians */
  public get angle(): UIRange {
    return this.angleInternal;
  }

  /** Speed range in units/second */
  public get magnitude(): UIRange {
    return this.magnitudeInternal;
  }

  /** Direction range in radians */
  public set angle(value: UIRangeConfig) {
    this.angleInternal = resolveUIRangeConfig(value);
    assertValidNumber(this.angleInternal.min, "UISpawnRandomVelocity.angle.min");
    assertValidNumber(this.angleInternal.max, "UISpawnRandomVelocity.angle.max");
  }

  /** Speed range in units/second */
  public set magnitude(value: UIRangeConfig) {
    this.magnitudeInternal = resolveUIRangeConfig(value);
    assertValidNumber(this.magnitudeInternal.min, "UISpawnRandomVelocity.magnitude.min");
    assertValidNumber(this.magnitudeInternal.max, "UISpawnRandomVelocity.magnitude.max");
  }

  /** @internal */
  public spawn(
    properties: { builtin: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { min: angleMin, max: angleMax } = this.angleInternal;
    const { min: magnitudeMin, max: magnitudeMax } = this.magnitudeInternal;

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * itemSize;
      const angle = MathUtils.randFloat(angleMin, angleMax);
      const magnitude = MathUtils.randFloat(magnitudeMin, magnitudeMax);
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] = Math.cos(angle) * magnitude;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] = Math.sin(angle) * magnitude;
    }

    builtin.needsUpdate = true;
  }
}

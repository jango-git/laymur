import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";

import {
  assertValidNonNegativeNumber,
  assertValidNumber,
} from "../../core/miscellaneous/asserts.js";
import type { UIRange, UIRangeConfig } from "../miscellaneous/miscellaneous.js";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  particleRandom,
  particleRandomStream,
  resolveUIRangeConfig,
} from "../miscellaneous/miscellaneous.js";
import { UISpawnModule } from "./UISpawnModule.js";

/** How `UISpawnCircle` places particles along its arc */
export enum UICircleDistribution {
  /** Each particle at a random angle */
  RANDOM = 0,
  /** The particles of one spawn call, such as one burst, evenly spaced */
  EVEN = 1,
}

/**
 * Spawns particles within a circle, a ring or a sector of them.
 *
 * Positions are uniform by area between the inner and the outer radius; equal radii give a
 * circle line. Angles are in radians, counter-clockwise from the right.
 */
export class UISpawnCircle extends UISpawnModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  public distribution: UICircleDistribution;
  private radiusInternal: UIRange;
  private arcInternal: UIRange;

  /**
   * @param radius - Inner and outer radius. Accepts number, tuple, or range object
   * @param arc - Angle range in radians. Accepts number, tuple, or range object
   * @param distribution - Random or even placement along the arc
   */
  constructor(
    radius: UIRangeConfig = { min: 0, max: 50 },
    arc: UIRangeConfig = { min: -Math.PI, max: Math.PI },
    distribution: UICircleDistribution = UICircleDistribution.RANDOM,
  ) {
    super();
    this.radiusInternal = resolveUIRangeConfig(radius);
    this.arcInternal = resolveUIRangeConfig(arc);
    this.distribution = distribution;
    this.assertValid("UISpawnCircle.constructor");
  }

  /** Inner and outer radius */
  public get radius(): UIRange {
    return this.radiusInternal;
  }

  /** Angle range in radians */
  public get arc(): UIRange {
    return this.arcInternal;
  }

  /** Inner and outer radius */
  public set radius(value: UIRangeConfig) {
    this.radiusInternal = resolveUIRangeConfig(value);
    this.assertValid("UISpawnCircle");
  }

  /** Angle range in radians */
  public set arc(value: UIRangeConfig) {
    this.arcInternal = resolveUIRangeConfig(value);
    this.assertValid("UISpawnCircle");
  }

  public spawn(
    properties: { builtin: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
    randomSalt: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;
    const { min: arcMin, max: arcMax } = this.arcInternal;
    const innerSquared = this.radiusInternal.min * this.radiusInternal.min;
    const outerSquared = this.radiusInternal.max * this.radiusInternal.max;
    const even = this.distribution === UICircleDistribution.EVEN;
    const count = instanceEnd - instanceBegin;

    const angleStream = particleRandomStream(randomSalt, 0);
    const radiusStream = particleRandomStream(randomSalt, 1);

    for (let i = instanceBegin; i < instanceEnd; i++) {
      const itemOffset = i * itemSize;
      // Cell centers: a full circle gets equal gaps, also between the last and the first.
      const angleT = even
        ? (i - instanceBegin + 0.5) / count
        : particleRandom(array, itemOffset, angleStream);
      const angle = MathUtils.lerp(arcMin, arcMax, angleT);
      // Area grows with r^2, so r^2 is uniform for a uniform density.
      const radius = Math.sqrt(
        MathUtils.lerp(innerSquared, outerSquared, particleRandom(array, itemOffset, radiusStream)),
      );
      array[itemOffset + BUILTIN_OFFSET_POSITION_X] = Math.cos(angle) * radius;
      array[itemOffset + BUILTIN_OFFSET_POSITION_Y] = Math.sin(angle) * radius;
    }

    builtin.needsUpdate = true;
  }

  private assertValid(subject: string): void {
    assertValidNonNegativeNumber(this.radiusInternal.min, `${subject}.radius.min`);
    assertValidNonNegativeNumber(this.radiusInternal.max, `${subject}.radius.max`);
    assertValidNumber(this.arcInternal.min, `${subject}.arc.min`);
    assertValidNumber(this.arcInternal.max, `${subject}.arc.max`);
  }
}

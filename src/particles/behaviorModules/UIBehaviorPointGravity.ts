import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";

import { assertValidNumber, assertValidPositiveNumber } from "../../core/miscellaneous/asserts.js";
import type { Vector2Like } from "../../core/miscellaneous/math.js";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
  particleRandom,
  particleRandomStream,
  resolveUIRangeConfig,
  resolveUIVector2Config,
  type UIRange,
  type UIRangeConfig,
  type UIVector2Config,
} from "../miscellaneous/miscellaneous.js";
import { UIBehaviorModule } from "./UIBehaviorModule.js";

/**
 * Applies gravity attraction toward a point.
 *
 * Force follows inverse power law: strength / distance^exponent. Particles closer than threshold are unaffected.
 */
export class UIBehaviorPointGravity extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private centerInternal: Vector2Like;
  private strengthInternal: UIRange;
  private exponentInternal: UIRange;
  private thresholdInternal: UIRange;

  /**
   * @param center - Gravity center position
   * @param strength - Force multiplier range. Accepts number, tuple, or range object
   * @param exponent - Distance power exponent range. Accepts number, tuple, or range object
   * @param threshold - Minimum distance range. Accepts number, tuple, or range object
   */
  constructor(
    center: UIVector2Config,
    strength: UIRangeConfig,
    exponent: UIRangeConfig = 2,
    threshold: UIRangeConfig = 1,
  ) {
    super();
    this.centerInternal = resolveUIVector2Config(center);
    assertValidNumber(this.centerInternal.x, "UIBehaviorPointGravity.constructor.center.x");
    assertValidNumber(this.centerInternal.y, "UIBehaviorPointGravity.constructor.center.y");

    this.strengthInternal = resolveUIRangeConfig(strength);
    assertValidNumber(this.strengthInternal.min, "UIBehaviorPointGravity.constructor.strength.min");
    assertValidNumber(this.strengthInternal.max, "UIBehaviorPointGravity.constructor.strength.max");

    this.exponentInternal = resolveUIRangeConfig(exponent);
    assertValidNumber(this.exponentInternal.min, "UIBehaviorPointGravity.constructor.exponent.min");
    assertValidNumber(this.exponentInternal.max, "UIBehaviorPointGravity.constructor.exponent.max");

    this.thresholdInternal = resolveUIRangeConfig(threshold);
    assertValidPositiveNumber(
      this.thresholdInternal.min,
      "UIBehaviorPointGravity.constructor.threshold.min",
    );
    assertValidPositiveNumber(
      this.thresholdInternal.max,
      "UIBehaviorPointGravity.constructor.threshold.max",
    );
  }

  /** Gravity center position */
  public get center(): Vector2Like {
    return this.centerInternal;
  }

  /** Force multiplier range */
  public get strength(): UIRange {
    return this.strengthInternal;
  }

  /** Distance power exponent range */
  public get exponent(): UIRange {
    return this.exponentInternal;
  }

  /** Minimum distance range */
  public get threshold(): UIRange {
    return this.thresholdInternal;
  }

  /** Gravity center position */
  public set center(value: UIVector2Config) {
    this.centerInternal = resolveUIVector2Config(value);
    assertValidNumber(this.centerInternal.x, "UIBehaviorPointGravity.center.x");
    assertValidNumber(this.centerInternal.y, "UIBehaviorPointGravity.center.y");
  }

  /** Force multiplier range */
  public set strength(value: UIRangeConfig) {
    this.strengthInternal = resolveUIRangeConfig(value);
    assertValidNumber(this.strengthInternal.min, "UIBehaviorPointGravity.strength.min");
    assertValidNumber(this.strengthInternal.max, "UIBehaviorPointGravity.strength.max");
  }

  /** Distance power exponent range */
  public set exponent(value: UIRangeConfig) {
    this.exponentInternal = resolveUIRangeConfig(value);
    assertValidNumber(this.exponentInternal.min, "UIBehaviorPointGravity.exponent.min");
    assertValidNumber(this.exponentInternal.max, "UIBehaviorPointGravity.exponent.max");
  }

  /** Minimum distance range */
  public set threshold(value: UIRangeConfig) {
    this.thresholdInternal = resolveUIRangeConfig(value);
    assertValidPositiveNumber(this.thresholdInternal.min, "UIBehaviorPointGravity.threshold.min");
    assertValidPositiveNumber(this.thresholdInternal.max, "UIBehaviorPointGravity.threshold.max");
  }

  public update(
    properties: { builtin: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
    randomSalt: number,
  ): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;

    const thresholdStream = particleRandomStream(randomSalt, 0);
    const strengthStream = particleRandomStream(randomSalt, 1);
    const exponentStream = particleRandomStream(randomSalt, 2);

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;

      const dx = this.centerInternal.x - array[itemOffset + BUILTIN_OFFSET_POSITION_X];
      const dy = this.centerInternal.y - array[itemOffset + BUILTIN_OFFSET_POSITION_Y];

      const thresholdT = particleRandom(array, itemOffset, thresholdStream);
      const threshold = MathUtils.lerp(this.threshold.min, this.threshold.max, thresholdT);

      const thresholdSquared = threshold * threshold;
      const distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < thresholdSquared) {
        continue;
      }

      const strengthT = particleRandom(array, itemOffset, strengthStream);
      const strength = MathUtils.lerp(
        this.strengthInternal.min,
        this.strengthInternal.max,
        strengthT,
      );

      const exponentT = particleRandom(array, itemOffset, exponentStream);
      const exponent = MathUtils.lerp(
        this.exponentInternal.min,
        this.exponentInternal.max,
        exponentT,
      );

      const distance = Math.sqrt(distanceSquared);
      const forceMagnitude = strength / Math.pow(distance, exponent);

      const directionX = dx / distance;
      const directionY = dy / distance;

      const accelerationX = directionX * forceMagnitude;
      const accelerationY = directionY * forceMagnitude;

      array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] += accelerationX * deltaTime;
      array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] += accelerationY * deltaTime;
    }

    builtin.needsUpdate = true;
  }
}

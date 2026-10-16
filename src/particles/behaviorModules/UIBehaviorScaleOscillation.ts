import type { InstancedBufferAttribute } from "three";
import { MathUtils } from "three";
import {
  assertValidNonNegativeNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts.js";
import type { UIAspectConfig, UIRange, UIRangeConfig } from "../miscellaneous/miscellaneous.js";
import {
  BUILTIN_OFFSET_AGE,
  BUILTIN_OFFSET_RANDOM_E,
  BUILTIN_OFFSET_RANDOM_F,
  BUILTIN_OFFSET_SCALE_X,
  BUILTIN_OFFSET_SCALE_Y,
  resolveAspect,
  resolveUIRangeConfig,
} from "../miscellaneous/miscellaneous.js";
import { UIBehaviorModule } from "./UIBehaviorModule.js";

/** Axis whose scale oscillates */
export type UIScaleOscillationAxis = "x" | "y";

/**
 * Oscillates particle scale along one axis, like a paper piece turning its edge to the viewer.
 *
 * The oscillating axis is derived from the other one every frame, so the module composes with
 * any scale source: put it after `UISpawnRandomScale` or `UIBehaviorScaleOverLife` in the sequence.
 * Each particle gets its own frequency and phase. With depth 1 the scale passes through zero and
 * turns negative, which shows the mirrored back side.
 */
export class UIBehaviorScaleOscillation extends UIBehaviorModule<{ builtin: "Matrix4" }> {
  /** @internal */
  public readonly requiredProperties = { builtin: "Matrix4" } as const;
  private readonly axisInternal: UIScaleOscillationAxis;
  private frequencyInternal: UIRange;
  private depthInternal: number;
  private aspectInternal: number;

  /**
   * @param axis - Axis whose scale oscillates
   * @param frequency - Oscillations per second. Accepts number, tuple, or range object
   * @param depth - 0 keeps the scale, 0.5 swings it between full and zero, 1 between full and mirrored
   * @param aspect - Width/height ratio, the same as given to the scale module. Accepts number or texture
   */
  constructor(
    axis: UIScaleOscillationAxis,
    frequency: UIRangeConfig,
    depth = 1,
    aspect: UIAspectConfig = 1,
  ) {
    super();
    this.axisInternal = axis;

    this.frequencyInternal = resolveUIRangeConfig(frequency);
    assertValidNonNegativeNumber(
      this.frequencyInternal.min,
      "UIBehaviorScaleOscillation.constructor.frequency.min",
    );
    assertValidNonNegativeNumber(
      this.frequencyInternal.max,
      "UIBehaviorScaleOscillation.constructor.frequency.max",
    );

    this.depthInternal = depth;
    assertValidNonNegativeNumber(
      this.depthInternal,
      "UIBehaviorScaleOscillation.constructor.depth",
    );

    this.aspectInternal = resolveAspect(aspect);
    assertValidPositiveNumber(this.aspectInternal, "UIBehaviorScaleOscillation.constructor.aspect");
  }

  /** Axis whose scale oscillates */
  public get axis(): UIScaleOscillationAxis {
    return this.axisInternal;
  }

  /** Oscillations per second */
  public get frequency(): UIRange {
    return this.frequencyInternal;
  }

  /** Swing of the scale: 0 none, 0.5 down to zero, 1 down to mirrored */
  public get depth(): number {
    return this.depthInternal;
  }

  /** Width/height aspect ratio */
  public get aspect(): number {
    return this.aspectInternal;
  }

  /** Oscillations per second */
  public set frequency(value: UIRangeConfig) {
    this.frequencyInternal = resolveUIRangeConfig(value);
    assertValidNonNegativeNumber(
      this.frequencyInternal.min,
      "UIBehaviorScaleOscillation.frequency.min",
    );
    assertValidNonNegativeNumber(
      this.frequencyInternal.max,
      "UIBehaviorScaleOscillation.frequency.max",
    );
  }

  /** Swing of the scale: 0 none, 0.5 down to zero, 1 down to mirrored */
  public set depth(value: number) {
    assertValidNonNegativeNumber(value, "UIBehaviorScaleOscillation.depth");
    this.depthInternal = value;
  }

  /** Width/height aspect ratio */
  public set aspect(value: UIAspectConfig) {
    this.aspectInternal = resolveAspect(value);
    assertValidPositiveNumber(this.aspectInternal, "UIBehaviorScaleOscillation.aspect");
  }

  /** @internal */
  public update(properties: { builtin: InstancedBufferAttribute }, instanceCount: number): void {
    const { builtin } = properties;
    const { array, itemSize } = builtin;

    for (let i = 0; i < instanceCount; i++) {
      const itemOffset = i * itemSize;

      const frequencyT = array[itemOffset + BUILTIN_OFFSET_RANDOM_E];
      const frequency = MathUtils.lerp(
        this.frequencyInternal.min,
        this.frequencyInternal.max,
        frequencyT,
      );
      const phase = array[itemOffset + BUILTIN_OFFSET_RANDOM_F] * Math.PI * 2;
      const angle = array[itemOffset + BUILTIN_OFFSET_AGE] * frequency * Math.PI * 2 + phase;
      const factor = 1 - this.depthInternal * (1 - Math.cos(angle));

      if (this.axisInternal === "x") {
        array[itemOffset + BUILTIN_OFFSET_SCALE_X] =
          array[itemOffset + BUILTIN_OFFSET_SCALE_Y] * this.aspectInternal * factor;
      } else {
        array[itemOffset + BUILTIN_OFFSET_SCALE_Y] =
          (array[itemOffset + BUILTIN_OFFSET_SCALE_X] / this.aspectInternal) * factor;
      }
    }

    builtin.needsUpdate = true;
  }
}

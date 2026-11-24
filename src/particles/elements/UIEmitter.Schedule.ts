import {
  assertValidNonNegativeNumber,
  assertValidPositiveNumber,
} from "../../core/miscellaneous/asserts.js";
import { assertValidNonNegativeInteger } from "../miscellaneous/miscellaneous.js";
import type { UIEmitterPlayOptions } from "./UIEmitter.Internal.js";

/**
 * Receives the particles due within a frame: `count` of them, at `firstMoment + k * interval`
 * seconds from the frame start
 */
export type UIEmissionSpawn = (count: number, firstMoment: number, interval: number) => void;

/**
 * Timing of an emission: a stream by time and by distance, and bursts at an interval. Knows when
 * particles are due, not where or how they are spawned.
 */
export class UIEmissionSchedule {
  private playing = false;
  private rate = 0;
  private ratePerDistance = 0;
  private duration = Infinity;
  private burstInterval = Infinity;
  private burstCount = 0;
  private elapsed = 0;
  /** Particles of the stream due but not spawned yet, below 1 after each frame */
  private accumulator = 0;
  private nextBurst = 0;

  /** Whether the emission has not ended yet */
  public get isPlaying(): boolean {
    return this.playing;
  }

  public start(rate: number, options: Partial<UIEmitterPlayOptions>): void {
    assertValidNonNegativeNumber(rate, "UIEmitter.play.rate");
    this.ratePerDistance = options.ratePerDistance ?? 0;
    assertValidNonNegativeNumber(this.ratePerDistance, "UIEmitter.play.options.ratePerDistance");
    // Infinite unless given: endless emission, a single burst
    this.duration = options.duration ?? Infinity;
    if (process.env.NODE_ENV !== "production" && options.duration !== undefined) {
      assertValidNonNegativeNumber(options.duration, "UIEmitter.play.options.duration");
    }
    this.burstInterval = options.burstInterval ?? Infinity;
    if (process.env.NODE_ENV !== "production" && options.burstInterval !== undefined) {
      assertValidPositiveNumber(options.burstInterval, "UIEmitter.play.options.burstInterval");
    }
    this.burstCount = options.burstCount ?? 0;
    assertValidNonNegativeInteger(this.burstCount, "UIEmitter.play.options.burstCount");

    this.playing = true;
    this.rate = rate;
    this.elapsed = 0;
    this.accumulator = 0;
    this.nextBurst = 0;
  }

  public stop(): void {
    this.playing = false;
  }

  /**
   * Advances the emission by a frame and hands the particles due within it to `spawn`
   * @param distance Distance the emitter moved during the frame
   */
  public advance(deltaTime: number, distance: number, spawn: UIEmissionSpawn): void {
    if (!this.playing) {
      return;
    }

    const before = this.elapsed;
    this.elapsed += deltaTime;
    const end = Math.min(this.elapsed, this.duration);
    const emittingTime = end - before;

    while (this.burstCount > 0 && this.nextBurst <= end) {
      spawn(this.burstCount, this.nextBurst - before, 0);
      this.nextBurst += this.burstInterval;
    }

    if (emittingTime > 0) {
      // The emitter is taken to move at a constant speed within the frame.
      const added =
        this.rate * emittingTime + (this.ratePerDistance * distance * emittingTime) / deltaTime;
      const accumulatorBefore = this.accumulator;
      this.accumulator += added;

      const count = Math.floor(this.accumulator);
      if (count > 0) {
        // The k-th particle of the frame, from 0, is due once the accumulator reaches k + 1.
        const interval = emittingTime / added;
        spawn(count, (1 - accumulatorBefore) * interval, interval);
        this.accumulator -= count;
      }
    }

    if (this.elapsed >= this.duration) {
      this.playing = false;
    }
  }
}

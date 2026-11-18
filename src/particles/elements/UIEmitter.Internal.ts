import type { UIAnchorOptions } from "../../core/elements/UIAnchor/UIAnchor.Internal.js";
import { UIBlendMode, UIMode } from "../../core/index.js";
import {
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_ROTATION,
  BUILTIN_OFFSET_TORQUE,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
} from "../miscellaneous/miscellaneous.js";

/** Coordinate space of particle positions */
export enum UIEmitterSpace {
  /** Relative to the emitter: live particles move with it */
  LOCAL = 0,
  /** Layer coordinates: a particle stays where it was spawned when the emitter moves */
  WORLD = 1,
}

/** Configuration options for UIEmitter */
export interface UIEmitterOptions extends UIAnchorOptions {
  /** Whether the particles are drawn */
  mode: UIEmitterMode;
  /** Color blending of the particles with what is drawn under them */
  blendMode: UIBlendMode;
  /**
   * Coordinate space of particle positions, and of the points behavior modules take, such as a
   * gravity center. Spawn modules always write positions relative to the emitter.
   */
  space: UIEmitterSpace;
  /** Number of particles to allocate for up front; a hint, not a limit */
  expectedCapacity: number;
  /** Capacity is kept a multiple of this; the buffers double when they grow */
  capacityStep: number;
  /** Longest frame step in seconds; longer frames, such as after a hidden tab, are clamped */
  maxDeltaTime: number;
  /**
   * Seed of the random values, a non-negative integer. Emitters with one seed and one sequence
   * of spawns produce the same particles. Random by default.
   */
  seed: number;
  /** Whether to call destroy() on all modules when the emitter is destroyed */
  automaticallyDestroyModules: boolean;
}

/** Options of `UIEmitter.play` */
export interface UIEmitterPlayOptions {
  /** Seconds of emission, endless by default */
  duration: number;
  /** Particles per unit of distance the emitter moves, on top of the particles per second */
  ratePerDistance: number;
  /** Particles per burst, the first burst at the start. No bursts by default. */
  burstCount: number;
  /** Seconds between bursts, a single burst by default */
  burstInterval: number;
}

/**
 * Path of the emitter over a frame of `time` seconds, in layer coordinates. Particles spawned at a
 * moment of the frame start at the point of that moment, interpolated linearly.
 */
export interface UISpawnPath {
  time: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export function ignoreInput(): boolean {
  return false;
}

export type UIEmitterMode = UIMode.HIDDEN | UIMode.VISIBLE;

export const EMITTER_DEFAULT_MODE: UIEmitterMode = UIMode.VISIBLE;
export const EMITTER_DEFAULT_BLEND_MODE = UIBlendMode.NORMAL;
export const EMITTER_DEFAULT_SPACE = UIEmitterSpace.LOCAL;
export const EMITTER_DEFAULT_EXPECTED_CAPACITY = 32;
export const EMITTER_DEFAULT_CAPACITY_STEP = 32;
export const EMITTER_DEFAULT_MAX_DELTA_TIME = 0.1;
export const EMITTER_DEFAULT_LIFETIME = 1;
export const EMITTER_DEFAULT_PREWARM_STEP = 1 / 30;
export const EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES = true;

/** Salts the emitter hands out: one for the builtin values the shaders read, one per module */
export const EMITTER_SHADER_SALT = 0;
export const EMITTER_SPAWN_SALT_BASE = 0x100;
export const EMITTER_BEHAVIOR_SALT_BASE = 0x200;

/**
 * Moves a particle along its velocity and torque for `time` seconds, negative to move it back
 * @param array Builtin buffer
 * @param itemOffset Offset of the particle in the builtin buffer
 */
export function advanceParticle(
  array: { [index: number]: number },
  itemOffset: number,
  time: number,
): void {
  array[itemOffset + BUILTIN_OFFSET_POSITION_X] +=
    array[itemOffset + BUILTIN_OFFSET_VELOCITY_X] * time;
  array[itemOffset + BUILTIN_OFFSET_POSITION_Y] +=
    array[itemOffset + BUILTIN_OFFSET_VELOCITY_Y] * time;
  array[itemOffset + BUILTIN_OFFSET_ROTATION] += array[itemOffset + BUILTIN_OFFSET_TORQUE] * time;
}

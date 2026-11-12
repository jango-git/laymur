import type { UIAnchorOptions } from "../../core/elements/UIAnchor/UIAnchor.Internal.js";
import { UIMode } from "../../core/index.js";

/** Configuration options for UIEmitter */
export interface UIEmitterOptions extends UIAnchorOptions {
  /** Whether the particles are drawn */
  mode: UIEmitterMode;
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

export interface UIEmitterPlayOptions {
  duration: number;
}

export function ignoreInput(): boolean {
  return false;
}

export type UIEmitterMode = UIMode.HIDDEN | UIMode.VISIBLE;

export const EMITTER_DEFAULT_MODE: UIEmitterMode = UIMode.VISIBLE;
export const EMITTER_DEFAULT_EXPECTED_CAPACITY = 32;
export const EMITTER_DEFAULT_CAPACITY_STEP = 32;
export const EMITTER_DEFAULT_MAX_DELTA_TIME = 0.1;
export const EMITTER_DEFAULT_LIFETIME = 1;
export const EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES = true;

/** Salts the emitter hands out: one for the builtin values the shaders read, one per module */
export const EMITTER_SHADER_SALT = 0;
export const EMITTER_SPAWN_SALT_BASE = 0x100;
export const EMITTER_BEHAVIOR_SALT_BASE = 0x200;

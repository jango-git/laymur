import { UIMode } from "../../core/index.js";
import type { UIAnchorOptions } from "../../core/elements/UIAnchor/UIAnchor.Internal.js";

/** Configuration options for UIEmitter */
export interface UIEmitterOptions extends UIAnchorOptions {
  /** Whether the particles are drawn */
  mode: UIEmitterMode;
  /** Number of particles to allocate for up front; a hint, not a limit */
  expectedCapacity: number;
  /** Number of particles the buffers grow by */
  capacityStep: number;
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
export const EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES = true;

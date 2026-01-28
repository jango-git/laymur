import { UIMode } from "../../core";
import type { UIAnchorOptions } from "../../core/elements/UIAnchor/UIAnchor.Internal";

export interface UIEmitterOptions extends UIAnchorOptions {
  expectedCapacity: number;
  capacityStep: number;
}

export function ignoreInput(): boolean {
  return false;
}

export type UIEmitterMode = UIMode.HIDDEN | UIMode.VISIBLE;

export const EMITTER_DEFAULT_MODE: UIEmitterMode = UIMode.VISIBLE;
export const EMITTER_DEFAULT_EXPECTED_CAPACITY = 32;
export const EMITTER_DEFAULT_CAPACITY_STEP = 32;
export const EMITTER_DEFAULT_AUTOMATICALLY_DESTROY_MODULES = true;

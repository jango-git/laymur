import type { Vector2Tuple } from "three";
import type { Vector2Like } from "../../core/miscellaneous/math";

export interface UIRange {
  min: number;
  max: number;
}

export type UIRangeConfig = UIRange | [number, number] | number;
export type UIVector2Config = Vector2Like | Vector2Tuple | number;

export function resolveUIRangeConfig(config: UIRangeConfig): UIRange {
  if (typeof config === "number") {
    return { min: config, max: config };
  }

  if (Array.isArray(config)) {
    return { min: config[0], max: config[1] };
  }

  return config;
}

export function resolveUIVector2Config(config: UIVector2Config): Vector2Like {
  if (typeof config === "number") {
    return { x: config, y: config };
  }

  if (Array.isArray(config)) {
    return { x: config[0], y: config[1] };
  }

  return config;
}

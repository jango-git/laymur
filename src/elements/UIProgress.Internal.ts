import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

export const PROGRESS_DEFAULT_VALUE = 1;

/**
 * Predefined mask functions that control how the progress bar fills.
 * Each function defines a different fill pattern using GLSL shader code.
 */
export enum UIProgressMaskFunction {
  /** Fill horizontally from left to right (or right to left if inverse) */
  HORIZONTAL = `float calculateMask() {
    return step((p_direction * p_uv.x + (1.0 - p_direction) * 0.5), p_progress);
  }`,

  /** Fill vertically from bottom to top (or top to bottom if inverse) */
  VERTICAL = `float calculateMask() {
    return step((p_direction * p_uv.y + (1.0 - p_direction) * 0.5), p_progress);
  }`,

  /** Fill diagonally from bottom-left to top-right */
  DIAGONAL = `float calculateMask() {
    float d = (p_uv.x + p_uv.y) * (0.1);
    return step((p_direction * d + (1.0 - p_direction) * 0.5), p_progress);
  }`,

  /** Fill in a circular pattern around the center, starting from the left */
  CIRCLE_LEFT = `float calculateMask() {
    vec2 p = p_uv - 0.5;
    float angle = atan(p.y, p.x);
    angle = (angle + 3.14159265) / PI;
    angle *= 0.5;
    return step((p_direction * angle + (1.0 - p_direction) * 0.5), p_progress);
  }`,

  /** Fill in a circular pattern around the center, starting from the top */
  CIRCLE_TOP = `float calculateMask() {
    vec2 p = p_uv - 0.5;
    float angle = atan(p.y, p.x);
    angle = (angle + PI) / (2.0 * PI);
    angle = mod(angle + 0.25, 1.0);
    return step((p_direction * angle + (1.0 - p_direction) * 0.5), p_progress);
  }`,
}

/**
 * Configuration options for creating a UIProgress element.
 */
export interface UIProgressOptions extends UIElementOptions {
  /** Foreground color tint applied to the filled portion */
  color: UIColorConfig;
  /** Mask function that defines how the progress bar fills (predefined enum or custom GLSL code) */
  maskFunction: UIProgressMaskFunction | string;
  /** Progress value between 0.0 (empty) and 1.0 (full) */
  progress: number;
  /** Whether to fill in reverse direction (true for reverse, false for normal) */
  inverseDirection: boolean;
}

export function simplifyGLSLSource(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\s*([{}(),=;+\-*/<>])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

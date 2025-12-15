import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIProgressMaskFunction } from "../miscellaneous/mask-function/UIProgressMaskFunction";
import type { UIElementOptions } from "./UIElement.Internal";

export const PROGRESS_DEFAULT_VALUE = 1;

/**
 * Configuration options for creating a UIProgress element.
 */
export interface UIProgressOptions extends UIElementOptions {
  color: UIColorConfig;
  maskFunction: UIProgressMaskFunction;
  progress: number;
}

export function simplifyGLSLSource(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\s*([{}(),=;+\-*/<>])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

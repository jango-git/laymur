import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import type { UIPropertyType } from "../../miscellaneous/generic-plane/shared";
import type { UIProgressMaskFunction } from "../../miscellaneous/mask-function/UIProgressMaskFunction";
import type { UIElementOptions } from "../UIElement/UIElement.Internal";

/** Configuration options for UIProgress */
export interface UIProgressOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
  /** Function controlling fill direction and shape */
  maskFunction: UIProgressMaskFunction;
  /** Progress from 0 (empty) to 1 (full) */
  progress: number;
}

export const PROGRESS_DEFAULT_VALUE = 1;
export const PROGRESS_TEMP_PROPERTIES: Record<string, UIPropertyType> = {};

export function simplifyGLSLSource(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/[^\n]*/g, "")
    .replace(/\s*([{}(),=;+\-*/<>])\s*/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

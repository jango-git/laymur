import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal.js";
import type { UIProgressMaskFunction } from "../../miscellaneous/mask-function/UIProgressMaskFunction.js";
import type { UIElementOptions } from "../UIElement/UIElement.Internal.js";

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

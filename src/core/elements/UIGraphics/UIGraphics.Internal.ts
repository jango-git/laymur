import { UIColor } from "../../miscellaneous/color/UIColor.js";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal.js";
import type { UIElementOptions } from "../UIElement/UIElement.Internal.js";

/** Configuration options for UIGraphics */
export interface UIGraphicsOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
}

export const GRAPHICS_DEFAULT_WIDTH = 2;
export const GRAPHICS_DEFAULT_HEIGHT = 2;
export const GRAPHICS_TEMP_COLOR = new UIColor();

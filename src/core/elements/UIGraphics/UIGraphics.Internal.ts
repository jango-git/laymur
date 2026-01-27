import { UIColor } from "../../miscellaneous/color/UIColor";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "../UIElement/UIElement.Internal";

/** Configuration options for UIGraphics */
export interface UIGraphicsOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
}

export const GRAPHICS_DEFAULT_WIDTH = 2;
export const GRAPHICS_DEFAULT_HEIGHT = 2;
export const GRAPHICS_TEMP_COLOR = new UIColor();

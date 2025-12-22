import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import type { UIPropertyType } from "../../miscellaneous/generic-plane/shared";
import type { UIElementOptions } from "../UIElement/UIElement.Internal";

/** Configuration options for UIGraphics */
export interface UIGraphicsOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
}

export const GRAPHICS_TEMP_PROPERTIES: Record<string, UIPropertyType> = {};

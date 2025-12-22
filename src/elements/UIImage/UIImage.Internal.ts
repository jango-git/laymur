import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import type { UIPropertyType } from "../../miscellaneous/generic-plane/shared";
import type { UIElementOptions } from "../UIElement/UIElement.Internal";

/** Configuration options for UIImage */
export interface UIImageOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
}

export const IMAGE_TEMP_PROPERTIES: Record<string, UIPropertyType> = {};

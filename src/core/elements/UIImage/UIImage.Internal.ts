import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal.js";
import type { UIElementOptions } from "../UIElement/UIElement.Internal.js";

/** Configuration options for UIImage */
export interface UIImageOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
}

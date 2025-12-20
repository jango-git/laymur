import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "../UIElement/UIElement.Internal";

/** Configuration options for UIGraphics */
export interface UIGraphicsOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
}

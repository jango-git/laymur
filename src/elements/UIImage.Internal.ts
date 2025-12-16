import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

/** Configuration options for UIImage */
export interface UIImageOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
}

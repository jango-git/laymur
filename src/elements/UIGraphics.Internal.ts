import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

export interface UIGraphicsOptions extends UIElementOptions {
  color: UIColorConfig;
}

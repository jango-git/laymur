import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

export interface UIImageOptions extends UIElementOptions {
  color: UIColorConfig;
}

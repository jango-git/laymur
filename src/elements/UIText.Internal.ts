import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIPaddingConfig } from "../miscellaneous/padding/UIPadding.Internal";
import type { UITextStyleConfig } from "../miscellaneous/text-style/UITextStyle.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

export const TEXT_DEFAULT_WIDTH = 256;

/**
 * Configuration options for UIText element creation.
 */
export interface UITextOptions extends UIElementOptions {
  color: UIColorConfig;
  padding: UIPaddingConfig;
  commonStyle: UITextStyleConfig;
}

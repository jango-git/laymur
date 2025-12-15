import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIPaddingConfig } from "../miscellaneous/padding/UIPadding.Internal";
import type { UITextStyleConfig } from "../miscellaneous/text-style/UITextStyle.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

export enum UITextResizeMode {
  BREAK = 0,
  SCALE = 1,
}

export const TEXT_DEFAULT_MAX_LINE_WIDTH = 1024;
export const TEXT_DEFAULT_RESIZE_MODE = UITextResizeMode.SCALE;

/**
 * Configuration options for UIText element creation.
 */
export interface UITextOptions extends UIElementOptions {
  color: UIColorConfig;
  padding: UIPaddingConfig;
  commonStyle: Partial<UITextStyleConfig>;
  resizeMode: UITextResizeMode;
  maxLineWidth: number;
}

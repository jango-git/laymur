import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import type { UIPaddingConfig } from "../../miscellaneous/padding/UIPadding.Internal";
import type { UITextStyleConfig } from "../../miscellaneous/text-style/UITextStyle.Internal";
import type { UIElementOptions } from "../UIElement.Internal";

/** Controls how text adapts to element size */
export enum UITextResizeMode {
  /** Break text into multiple lines when narrower than content*/
  BREAK = 0,
  /** Scale text to fit fixed element size */
  SCALE = 1,
}

/** Configuration options for UIText */
export interface UITextOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
  /** Text padding in world units */
  padding: UIPaddingConfig;
  /** Default style applied to all spans */
  commonStyle: Partial<UITextStyleConfig>;
  /** How text adapts to size constraints */
  resizeMode: UITextResizeMode;
  /** Maximum line width before wrapping in pixels */
  maxLineWidth: number;
}

export const TEXT_DEFAULT_MAX_LINE_WIDTH = 1024;
export const TEXT_DEFAULT_RESIZE_MODE = UITextResizeMode.SCALE;

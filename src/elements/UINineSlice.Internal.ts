import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIPaddingConfig } from "../miscellaneous/padding/UIPadding.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

export const NINE_DEFAULT_BORDER = 0.1;

export interface UINineSliceOptions extends UIElementOptions {
  color: UIColorConfig;
  sliceBorders: UIPaddingConfig;
  sliceRegions: UIPaddingConfig;
}

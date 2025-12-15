import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIPaddingConfig } from "../miscellaneous/padding/UIPadding.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

export enum UINineSliceRegionMode {
  NORMALIZED = 0,
  WORLD = 1,
}

export const NINE_SLICE_DEFAULT_BORDER = 0.1;
export const NINE_SLICE_DEFAULT_REGION_MODE = UINineSliceRegionMode.WORLD;

export interface UINineSliceOptions extends UIElementOptions {
  color: UIColorConfig;
  sliceBorders: UIPaddingConfig;
  sliceRegions: UIPaddingConfig;
  regionMode: UINineSliceRegionMode;
}

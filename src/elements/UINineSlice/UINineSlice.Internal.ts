import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import type { UIPaddingConfig } from "../../miscellaneous/padding/UIPadding.Internal";
import type { UIElementOptions } from "../UIElement/UIElement.Internal";

/** Controls how sliceRegions values are interpreted */
export enum UINineSliceRegionMode {
  /** sliceRegions in normalized coordinates (0 to 1) */
  NORMALIZED = 0,
  /** sliceRegions in world units */
  WORLD = 1,
}

/** Configuration options for UINineSlice */
export interface UINineSliceOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
  /** Border size in normalized texture coordinates (0 to 1) */
  sliceBorders: UIPaddingConfig;
  /** Region size. Interpretation depends on regionMode. */
  sliceRegions: UIPaddingConfig;
  /** How sliceRegions values are interpreted */
  regionMode: UINineSliceRegionMode;
}

export const NINE_SLICE_DEFAULT_BORDER = 0.1;
export const NINE_SLICE_DEFAULT_REGION_MODE = UINineSliceRegionMode.WORLD;

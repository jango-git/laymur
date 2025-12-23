import type { UIResizePolicy } from "../../miscellaneous/resize-policy/UIResizePolicy";
import { UIResizePolicyNone } from "../../miscellaneous/resize-policy/UIResizePolicyNone";
import type { UILayerOptions } from "../UILayer/UILayer.Internal";

/** Configuration for fullscreen layer */
export interface UIFullscreenLayerOptions
  extends Omit<UILayerOptions, "width" | "height"> {
  /** Strategy for handling window resize */
  resizePolicy: UIResizePolicy;
}

export const FULLSCREEN_LAYER_DEFAULT_RESIZE_POLICY = new UIResizePolicyNone();

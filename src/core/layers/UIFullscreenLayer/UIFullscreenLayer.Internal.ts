import type { UIResizePolicy } from "../../miscellaneous/resize-policy/UIResizePolicy.js";
import { UIResizePolicyNone } from "../../miscellaneous/resize-policy/UIResizePolicyNone.js";
import type { UILayerOptions } from "../UILayer/UILayer.Internal.js";
import type { UIFullscreenLayer } from "./UIFullscreenLayer.js";

/** Fullscreen layer input event data */
export interface UIFullscreenLayerInputEventData {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Pointer identifier */
  identifier: number;
  /** Layer that emitted the event */
  layer: UIFullscreenLayer;
}

/** Configuration for fullscreen layer */
export interface UIFullscreenLayerOptions extends Omit<UILayerOptions, "width" | "height"> {
  /** Strategy for handling window resize */
  resizePolicy: UIResizePolicy;
}

export const FULLSCREEN_LAYER_DEFAULT_RESIZE_POLICY = new UIResizePolicyNone();

import type { UIResizePolicy } from "../../miscellaneous/resize-policy/UIResizePolicy.js";
import { UIResizePolicyNone } from "../../miscellaneous/resize-policy/UIResizePolicyNone.js";
import type { UIViewport } from "../../miscellaneous/viewport/UIViewport.js";
import type { UILayerOptions } from "../UILayer/UILayer.Internal.js";
import type { UIViewportLayer } from "./UIViewportLayer.js";

/** Viewport layer input event data */
export interface UIViewportLayerInputEventData {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Pointer identifier */
  identifier: number;
  /** Layer that emitted the event */
  layer: UIViewportLayer;
}

/** Configuration for viewport layer */
export interface UIViewportLayerOptions extends Omit<UILayerOptions, "width" | "height"> {
  /** Strategy for scaling the viewport size to the layer size */
  resizePolicy: UIResizePolicy;
  /**
   * Part of the page the layer covers; the whole window by default. A viewport passed here
   * belongs to the caller and is not destroyed with the layer.
   */
  viewport: UIViewport;
}

export const VIEWPORT_LAYER_DEFAULT_RESIZE_POLICY = new UIResizePolicyNone();

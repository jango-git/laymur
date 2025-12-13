import type { UIMode } from "../miscellaneous/UIMode";

/**
 * Events that can be emitted by UI layers.
 */
export enum UILayerEvent {
  /** Emitted when the layer's orientation changes between horizontal and vertical. */
  ORIENTATION_CHANGE = "orientation_change",
  /** Emitted when the layer's visibility/interaction mode changes. */
  MODE_CHANGE = "mode_change",
  /** Emitted before the layer is rendered. */
  WILL_RENDER = "will_render",
}

export type UILayerMode = UIMode.HIDDEN | UIMode.VISIBLE | UIMode.INTERACTIVE;

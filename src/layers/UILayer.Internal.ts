import type { UIMode } from "../miscellaneous/UIMode";
import type { UIOrientation } from "../miscellaneous/UIOrientation";

/**
 * Events that can be emitted by UI layers.
 */
export enum UILayerEvent {
  /** Emitted when the layer's orientation changes between horizontal and vertical. */
  ORIENTATION_CHANGED = "orientation_changed",
  /** Emitted when the layer's visibility/interaction mode changes. */
  MODE_CHANGED = "mode_changed",
  /** Emitted before the layer is rendered. */
  RENDERING = "rendering",
}

export type UILayerMode = UIMode.HIDDEN | UIMode.VISIBLE | UIMode.INTERACTIVE;

export type UILayerOrientation =
  | UIOrientation.VERTICAL
  | UIOrientation.HORIZONTAL;

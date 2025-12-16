import type { UIMode } from "../miscellaneous/UIMode";
import type { UIOrientation } from "../miscellaneous/UIOrientation";

/** Layer lifecycle and state events */
export enum UILayerEvent {
  /** Fired when orientation changes */
  ORIENTATION_CHANGED = "orientation_changed",
  /** Fired when mode changes */
  MODE_CHANGED = "mode_changed",
  /** Fired during rendering */
  RENDERING = "rendering",
}

/** Layer visibility and interactivity state */
export type UILayerMode = UIMode.HIDDEN | UIMode.VISIBLE | UIMode.INTERACTIVE;

/** Layer orientation state */
export type UILayerOrientation =
  | UIOrientation.VERTICAL
  | UIOrientation.HORIZONTAL;

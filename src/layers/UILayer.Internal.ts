import type { UIMode } from "../miscellaneous/UIMode";
import type { UIOrientation } from "../miscellaneous/UIOrientation";

export enum UILayerEvent {
  ORIENTATION_CHANGED = "orientation_changed",
  MODE_CHANGED = "mode_changed",
  RENDERING = "rendering",
}

export type UILayerMode = UIMode.HIDDEN | UIMode.VISIBLE | UIMode.INTERACTIVE;

export type UILayerOrientation =
  | UIOrientation.VERTICAL
  | UIOrientation.HORIZONTAL;

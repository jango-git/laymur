import { UIMode } from "../../miscellaneous/UIMode";
import type { UIOrientation } from "../../miscellaneous/UIOrientation";

/** Layer visibility and interactivity state */
export type UILayerMode = UIMode.HIDDEN | UIMode.VISIBLE | UIMode.INTERACTIVE;

/** Layer orientation state */
export type UILayerOrientation = UIOrientation.VERTICAL | UIOrientation.HORIZONTAL;

/** Configuration options for UILayer */
export interface UILayerOptions {
  /** Initial width */
  width: number;
  /** Initial height */
  height: number;
  /** Optional layer name */
  name: string;
  /** Initial visibility and interactivity mode */
  mode: UILayerMode;
}

export const LAYER_DEFAULT_SIZE = 1024;
export const LAYER_DEFAULT_NAME = "";
export const LAYER_DEFAULT_MODE: UILayerMode = UIMode.VISIBLE;

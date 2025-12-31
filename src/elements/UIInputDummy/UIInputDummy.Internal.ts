import type { UIArea } from "../../miscellaneous/area/UIArea";
import { UIMode } from "../../miscellaneous/UIMode";
import type { UIAnchorOptions } from "../UIAnchor/UIAnchor.Internal";

/** Configuration options for UIInputDummy */
export interface UIInputDummyOptions extends UIAnchorOptions {
  /** Width in world units */
  width: number;
  /** Height in world units */
  height: number;
  /** Shape defining interactive region in element-local space (0,0 = bottom-left, 1,1 = top-right) */
  interactionArea: UIArea;
  /** Controls visibility and interactivity */
  mode: UIMode;
}

export const DUMMY_DEFAULT_WIDTH = 64;
export const DUMMY_DEFAULT_HEIGHT = 32;
export const DUMMY_DEFAULT_MODE = UIMode.VISIBLE;
export const DUMMY_DEFAULT_Z_INDEX = 0;

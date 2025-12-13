import type { UIArea } from "../miscellaneous/area/UIArea";
import { UIMode } from "../miscellaneous/UIMode";
import type { UIAnchorOptions } from "./UIAnchor.Internal";

export const DUMMY_DEFAULT_WIDTH = 64;
export const DUMMY_DEFAULT_HEIGHT = 32;
export const DUMMY_DEFAULT_MODE = UIMode.VISIBLE;
export const DUMMY_DEFAULT_Z_INDEX = 0;

export interface UIDummyOptions extends UIAnchorOptions {
  width: number;
  height: number;
  interactionArea: UIArea;
  mode: UIMode;
}

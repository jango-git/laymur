import type { UIArea } from "../../miscellaneous/area/UIArea.js";
import { UIMode } from "../../miscellaneous/UIMode.js";
import type { UIAnchorOptions } from "../UIAnchor/UIAnchor.Internal.js";
import type { UIDummy } from "./UIDummy.js";

/** Input event data */
export interface UIInputEventData {
  /** X coordinate */
  x: number;
  /** Y coordinate */
  y: number;
  /** Pointer identifier */
  identifier: number;
  /** Element that emitted the event */
  element: UIDummy;
}

/** Configuration options for UIDummy */
export interface UIDummyOptions extends UIAnchorOptions {
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

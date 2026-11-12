import type { UIArea } from "../../miscellaneous/area/UIArea.js";
import type { UIMask } from "../../miscellaneous/mask/UIMask.js";
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

/** What an element knows of a pointer: kept while it is over the element or pressed on it */
export interface UIDummyPointerState {
  /** Last position, for signals of a cancel, which comes with none */
  x: number;
  y: number;
  /** Over the element as of the last event */
  inside: boolean;
  /** Pressed on the element and not released yet: the element holds the pointer */
  pressed: boolean;
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
  /** Mask clipping the element, see UIDummy.mask */
  mask: UIMask | null;
}

export const DUMMY_DEFAULT_WIDTH = 64;
export const DUMMY_DEFAULT_HEIGHT = 32;
export const DUMMY_DEFAULT_MODE = UIMode.VISIBLE;
export const DUMMY_DEFAULT_Z_INDEX = 0;

import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

/** Animation playback events */
export enum UIAnimatedImageEvent {
  /** Animation started or resumed */
  PLAYED = 0,
  /** Animation paused */
  PAUSED = 1,
  /** Animation stopped and reset */
  STOPPED = 2,
}

/** Configuration options for UIAnimatedImage */
export interface UIAnimatedImageOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
  /** Animation speed in frames per second */
  frameRate: number;
  /** Whether animation repeats after completion */
  loop: boolean;
  /** Whether to start playing immediately */
  playByDefault: boolean;
}

export const ANIMATED_IMAGE_DEFAULT_FRAME_RATE = 24;
export const ANIMATED_IMAGE_DEFAULT_LOOP = true;

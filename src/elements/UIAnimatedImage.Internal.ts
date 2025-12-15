import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

export const ANIMATED_IMAGE_DEFAULT_FRAME_RATE = 24;
export const ANIMATED_IMAGE_DEFAULT_LOOP = true;

export enum UIAnimatedImageEvent {
  PLAY = 0,
  PAUSE = 1,
  STOP = 2,
}

/**
 * Configuration options for creating a UIAnimatedImage element.
 */
export interface UIAnimatedImageOptions extends UIElementOptions {
  color: UIColorConfig;
  /** Frame rate for animation */
  frameRate: number;
  /** Whether animation should loop */
  loop: boolean;
  playByDefault: boolean;
}

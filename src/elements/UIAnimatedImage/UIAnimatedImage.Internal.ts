import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "../UIElement/UIElement.Internal";

/** Animation playback events */
export enum UIAnimatedImageEvent {
  /** Animation started or resumed */
  PLAYED = 0,
  /** Animation paused */
  PAUSED = 1,
  /** Animation stopped and reset */
  STOPPED = 2,
}

/** Animation loop behavior */
export enum UILoopMode {
  /** No looping, stops at boundary frame */
  NONE = 0,
  /** Loops back to opposite frame */
  LOOP = 1,
  /** Reverses direction at boundaries */
  PING_PONG = 2,
}

/** Configuration options for UIAnimatedImage */
export interface UIAnimatedImageOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
  /** Animation speed in frames per second */
  frameRate: number;
  /** Playback speed multiplier. Can be negative for reverse playback. */
  timeScale: number;
  /** Loop behavior */
  loopMode: UILoopMode;
  /** Whether to start playing immediately */
  playByDefault: boolean;
}

export const ANIMATED_IMAGE_DEFAULT_FRAME_RATE = 24;
export const ANIMATED_IMAGE_DEFAULT_TIME_SCALE = 1;
export const ANIMATED_IMAGE_DEFAULT_LOOP_MODE = UILoopMode.LOOP;

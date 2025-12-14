import type { Camera, Scene } from "three";
import { UIColor } from "../miscellaneous/color/UIColor";
import type { UIColorConfig } from "../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "./UIElement.Internal";

/**
 * Update modes for controlling when the 3D scene should be re-rendered.
 */
export enum UISceneUpdateMode {
  EACH_FRAME = 1,
  EVERY_SECOND_FRAME = 2,
  ON_PROPERTIES_CHANGE = 3,
  ON_DIMENSIONS_CHANGE = 4,
  MANUAL = 5,
}

/** Default resolution factor for render target sizing. */
export const SCENE_DEFAULT_RESOLUTION_FACTOR = 0.5;
/** Minimum allowed resolution factor to prevent performance issues. */
export const SCENE_MIN_RESOLUTION_FACTOR = 0.1;
/** Maximum allowed resolution factor to prevent memory issues. */
export const SCENE_MAX_RESOLUTION_FACTOR = 2;
/** Default field of view for the perspective camera in degrees. */
export const SCENE_DEFAULT_CAMERA_FOV = 60;
/** Default near clipping plane distance for the camera. */
export const SCENE_DEFAULT_CAMERA_NEAR = 0.1;
/** Default far clipping plane distance for the camera. */
export const SCENE_DEFAULT_CAMERA_FAR = 100;
/** Default update mode for scene rendering. */
export const SCENE_DEFAULT_UPDATE_MODE = UISceneUpdateMode.ON_PROPERTIES_CHANGE;
/** Default clear color for the render target. */
export const SCENE_DEFAULT_CLEAR_COLOR = new UIColor(0, 0, 0, 1);
/** Default depth buffer usage setting. */
export const SCENE_DEFAULT_USE_DEPTH = true;

/**
 * Configuration options for UIScene element creation.
 */
export interface UISceneOptions extends UIElementOptions {
  color: UIColorConfig;
  scene: Scene;
  camera: Camera;
  updateMode: UISceneUpdateMode;
  resolutionFactor: number;
  clearColor: UIColorConfig;
  enableDepthBuffer: boolean;
}

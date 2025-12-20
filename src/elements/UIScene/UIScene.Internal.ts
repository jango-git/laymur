import type { Camera, Scene } from "three";
import { UIColor } from "../../miscellaneous/color/UIColor";
import type { UIColorConfig } from "../../miscellaneous/color/UIColor.Internal";
import type { UIElementOptions } from "../UIElement/UIElement.Internal";

/** Controls when scene re-renders */
export enum UISceneUpdateMode {
  /** Re-render every frame */
  EACH_FRAME = 1,
  /** Re-render every other frame */
  EVERY_SECOND_FRAME = 2,
  /** Re-render when scene, camera, or updateMode changes */
  ON_PROPERTIES_CHANGE = 3,
  /** Re-render when dimensions or resolutionFactor changes */
  ON_DIMENSIONS_CHANGE = 4,
  /** Re-render only via requestUpdate() */
  MANUAL = 5,
}

/** Configuration options for UIScene */
export interface UISceneOptions extends UIElementOptions {
  /** Multiplicative tint */
  color: UIColorConfig;
  /** Three.js scene to render */
  scene: Scene;
  /** Camera used for rendering */
  camera: Camera;
  /** When to re-render */
  updateMode: UISceneUpdateMode;
  /** Render target resolution multiplier. Range 0.1 to 2.0. */
  resolutionFactor: number;
  /** Background color */
  clearColor: UIColorConfig;
  /** Whether to use depth buffer */
  enableDepthBuffer: boolean;
}

export const SCENE_DEFAULT_RESOLUTION_FACTOR = 0.5;
export const SCENE_MIN_RESOLUTION_FACTOR = 0.1;
export const SCENE_MAX_RESOLUTION_FACTOR = 2;
export const SCENE_DEFAULT_CAMERA_FOV = 60;
export const SCENE_DEFAULT_CAMERA_NEAR = 0.1;
export const SCENE_DEFAULT_CAMERA_FAR = 100;
export const SCENE_DEFAULT_UPDATE_MODE = UISceneUpdateMode.ON_PROPERTIES_CHANGE;
export const SCENE_DEFAULT_CLEAR_COLOR = new UIColor(0, 0, 0, 1);
export const SCENE_DEFAULT_USE_DEPTH = true;

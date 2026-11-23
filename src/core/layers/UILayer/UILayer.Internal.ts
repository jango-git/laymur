import type { Camera, Object3D, WebGLRenderTarget } from "three";

import { assertValidPositiveNumber } from "../../miscellaneous/asserts.js";
import { UIMode } from "../../miscellaneous/UIMode.js";
import { UIOrientation } from "../../miscellaneous/UIOrientation.js";

/** Layer visibility and interactivity state */
export type UILayerMode = UIMode.HIDDEN | UIMode.VISIBLE | UIMode.INTERACTIVE;

/** Layer orientation state */
export type UILayerOrientation =
  UIOrientation.VERTICAL | UIOrientation.HORIZONTAL | UIOrientation.SQUARE;

/** Range of aspects, width divided by height, both ends included */
export interface UIAspectRange {
  /** Lowest aspect, at most 1 */
  min: number;
  /** Highest aspect, at least 1 */
  max: number;
}

/**
 * Compilation of a layer, passed to the handlers of `UILayer.signalCompiling`. Valid only while
 * the signal is being emitted.
 */
export interface UILayerCompilation {
  /**
   * Compiles a scene an element draws apart from the layer, such as into its own render target.
   * The layer waits for it together with its own programs.
   * @param scene Scene to compile
   * @param camera Camera the scene is drawn with
   * @param renderTarget Target the scene is drawn into
   */
  compileScene(scene: Object3D, camera: Camera, renderTarget: WebGLRenderTarget): void;
}

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
  /** Aspects the layer counts as square; null for no square orientation */
  squareAspectRange: UIAspectRange | null;
}

export const LAYER_DEFAULT_SIZE = 1024;
export const LAYER_DEFAULT_NAME = "";
export const LAYER_DEFAULT_MODE: UILayerMode = UIMode.VISIBLE;

/**
 * Validates an aspect range and copies it.
 * @param range Range to validate
 * @param subject Value name for error messages
 * @returns Copy of the range
 * @throws If an end is not positive, min is above 1 or max is below 1
 */
export function copyValidAspectRange(range: UIAspectRange, subject: string): UIAspectRange {
  assertValidPositiveNumber(range.min, `${subject}.min`);
  assertValidPositiveNumber(range.max, `${subject}.max`);
  if (range.min > 1 || range.max < 1) {
    throw new Error(
      `${subject}: range must include the aspect 1, got ${range.min} to ${range.max}`,
    );
  }
  return { min: range.min, max: range.max };
}

/**
 * Orientation of an area.
 * @param width Area width
 * @param height Area height
 * @param squareAspectRange Aspects counted as square; null for none
 * @returns SQUARE within the range, otherwise HORIZONTAL if wider than high, else VERTICAL
 */
export function calculateLayerOrientation(
  width: number,
  height: number,
  squareAspectRange: Readonly<UIAspectRange> | null,
): UILayerOrientation {
  const aspect = width / height;
  if (
    squareAspectRange !== null &&
    aspect >= squareAspectRange.min &&
    aspect <= squareAspectRange.max
  ) {
    return UIOrientation.SQUARE;
  }
  return aspect > 1 ? UIOrientation.HORIZONTAL : UIOrientation.VERTICAL;
}

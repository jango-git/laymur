import type { WebGLRenderer } from "three";
import { Vector2, Vector4 } from "three";

export const DEBUG_RENDER_ORDER = 8192;
export const DEBUG_LINE_WIDTH = 2;
export const DEBUG_BADGE_SIZE = 150;
export const DEBUG_BADGE_FONT_SIZE = 30;
export const DEBUG_BADGE_FONT_FAMILY = "monospace";
export const DEBUG_BADGE_BACKGROUND_COLOR = "rgba(0, 0, 0, 0.8)";
export const debugResolutionVector = new Vector2();

const debugViewport = new Vector4();

/**
 * Sets `debugResolutionVector` to the size of the current viewport, the value three.js 0.165 and
 * later write into `LineMaterial.resolution` before each draw. Earlier versions keep the value
 * set here, so line widths are the same on every version.
 */
export function updateDebugResolution(renderer: WebGLRenderer): void {
  renderer.getViewport(debugViewport);
  debugResolutionVector.set(debugViewport.z, debugViewport.w);
}

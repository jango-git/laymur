import type { UIColorConfig } from "./UIColor.Internal.js";
import { COLORS } from "./UIColor.Internal.js";
import { UIColor } from "./UIColor.js";

const TEMP_COLOR = new UIColor();

/**
 * Converts a color to a canvas color. A `UIColor` name means the color `UIColor` gives it, any
 * other string is taken as a CSS color and passed as it is, and any other value is converted
 * through `UIColor`.
 * @param color Color to convert
 * @returns CSS color string
 */
export function toCanvasColor(color: UIColorConfig): string {
  return typeof color === "string" && COLORS[color] === undefined
    ? color
    : TEMP_COLOR.set(color).toCSSColor();
}

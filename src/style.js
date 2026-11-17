import { UIColor } from "laymur";

export const COLORS = {
  accent: "#ff8c1a",
  warn: "#ff4433",
  text: "#ececec",
  dim: "#868686",
  stage: "#050505",
  screen: "#0a0a0a",
};
export const MONO = "Ubuntu Sans Mono";
export const SANS = "Space Grotesk";

await Promise.all([
  document.fonts.load(`500 20px "${MONO}"`),
  document.fonts.load(`40px "${SANS}"`),
]);

export const hex = (css) => parseInt(css.slice(1), 16);
export const rgba = (css, alpha) => {
  const value = hex(css);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
};
export const color = (css, alpha = 1) => new UIColor(hex(css), alpha);

/**
 * Frame and label colors of a control of the page. The current one is in the accent color and
 * the one under the pointer is bright.
 */
export function controlColors({ isCurrent = false, isHovered = false }) {
  if (isCurrent) {
    return [color(COLORS.accent), color(COLORS.text)];
  }
  return isHovered
    ? [color(COLORS.text, 0.7), color(COLORS.text)]
    : [color(COLORS.dim, 0.3), color(COLORS.dim)];
}

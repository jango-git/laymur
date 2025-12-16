/** Visibility and interactivity state */
export enum UIMode {
  /** Not rendered, no input */
  HIDDEN = 0,
  /** Rendered, no input */
  VISIBLE = 1,
  /** Rendered, receives input, blocks input to elements behind */
  INTERACTIVE = 2,
  /** Rendered, receives input, passes input to elements behind */
  INTERACTIVE_TRANSPARENT = 3,
}

/**
 * Checks if mode allows input events.
 * @param mode Mode to check
 * @returns True if interactive
 */
export function isUIModeInteractive(mode: UIMode): boolean {
  return mode === UIMode.INTERACTIVE || mode === UIMode.INTERACTIVE_TRANSPARENT;
}

/**
 * Checks if mode is rendered.
 * @param mode Mode to check
 * @returns True if visible
 */
export function isUIModeVisible(mode: UIMode): boolean {
  return mode !== UIMode.HIDDEN;
}

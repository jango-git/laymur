/**
 * Defines the screen orientation states for UI constraints.
 *
 * This enum is used to specify when certain UI constraints should be active
 * based on the current device/screen orientation.
 */
export enum UIOrientation {
  /**
   * Indicates a landscape orientation (width > height).
   * Constraints using this value will only be active in landscape mode.
   */
  HORIZONTAL,

  /**
   * Indicates a portrait orientation (height > width).
   * Constraints using this value will only be active in portrait mode.
   */
  VERTICAL,

  /**
   * Indicates that the constraint should always be active,
   * regardless of screen orientation.
   */
  ALWAYS,
}

/**
 * Resolves an optional orientation to a definite value.
 *
 * @param orientation - The orientation to resolve, or undefined
 * @returns The provided orientation, or ALWAYS if none was provided
 */
export function resolveOrientation(orientation?: UIOrientation): UIOrientation {
  return orientation ?? UIOrientation.ALWAYS;
}

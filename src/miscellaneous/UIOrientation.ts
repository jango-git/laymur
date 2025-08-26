/**
 * Screen orientation states for UI constraints.
 *
 * Specifies when certain UI constraints should be active based on the
 * current device/screen orientation.
 *
 * @public
 */
export enum UIOrientation {
  /** Landscape orientation (width > height). */
  HORIZONTAL = 0,

  /** Portrait orientation (height > width). */
  VERTICAL = 1,

  /** Constraint always active, regardless of orientation. */
  ALWAYS = 2,
}

/**
 * Resolves an optional orientation to a definite value.
 *
 * @param orientation - Orientation to resolve, or undefined
 * @returns Provided orientation, or ALWAYS if none was provided
 * @public
 */
export function resolveOrientation(orientation?: UIOrientation): UIOrientation {
  return orientation ?? UIOrientation.ALWAYS;
}

/** Screen orientation for conditional constraints */
export enum UIOrientation {
  /** Landscape (width > height) */
  HORIZONTAL = 0,
  /** Portrait (height > width) */
  VERTICAL = 1,
  /** Active in any orientation */
  ALWAYS = 2,
}

/**
 * Resolves optional orientation.
 * @param orientation Orientation to resolve
 * @returns Orientation or ALWAYS if undefined
 */
export function resolveOrientation(orientation?: UIOrientation): UIOrientation {
  return orientation ?? UIOrientation.ALWAYS;
}

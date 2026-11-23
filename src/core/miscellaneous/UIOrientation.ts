/**
 * Screen orientations of the layer a constraint is active in. Flags combine with `|`, so
 * `UIOrientation.VERTICAL | UIOrientation.SQUARE` is active in portrait and square.
 */
export enum UIOrientation {
  /** Landscape (width > height) */
  HORIZONTAL = 1,
  /** Portrait (height >= width) */
  VERTICAL = 2,
  /** Square, the aspect within the `squareAspectRange` of the layer */
  SQUARE = 4,
  /** Active in any orientation */
  ALWAYS = 7,
}

/**
 * Resolves optional orientation.
 * @param orientation Orientation to resolve
 * @returns Orientation or ALWAYS if undefined
 */
export function resolveOrientation(orientation?: UIOrientation): UIOrientation {
  return orientation ?? UIOrientation.ALWAYS;
}

/**
 * Checks whether a set of orientations includes the orientation of a layer.
 * @param orientations Orientation flags
 * @param layerOrientation Orientation of the layer
 * @returns True if the flag of the layer orientation is set
 */
export function isOrientationIncluded(
  orientations: UIOrientation,
  layerOrientation: UIOrientation,
): boolean {
  return (orientations & layerOrientation) !== 0;
}

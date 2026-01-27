/** Transparency rendering modes */
export enum UITransparencyMode {
  /** Binary transparency. Best performance. */
  CLIP = 0,
  /** Dithered transparency. Good performance. */
  HASH = 1,
  /** Alpha blending. Best quality, requires depth sorting. */
  BLEND = 2,
}

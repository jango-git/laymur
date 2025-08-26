/**
 * Transparency rendering modes for UI elements.
 *
 * Controls how transparent pixels are handled during rendering.
 * Each mode offers different performance and visual quality trade-offs.
 *
 * @public
 */
export enum UITransparencyMode {
  /** Pixels are either fully opaque or fully transparent. Best performance. */
  CLIP = 0,

  /** Dithered transparency using screen-door patterns. Good performance. */
  HASH = 1,

  /** True alpha blending with smooth transparency. Best visual quality. */
  BLEND = 2,
}

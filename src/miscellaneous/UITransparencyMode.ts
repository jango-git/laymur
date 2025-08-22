/**
 * Transparency rendering modes for UI elements.
 *
 * Controls how transparent and semi-transparent pixels are handled during rendering.
 * Each mode offers different performance and visual quality trade-offs.
 */
export enum UITransparencyMode {
  /**
   * Clip mode - pixels are either fully opaque or fully transparent.
   * Uses alpha testing to discard pixels below a threshold.
   * Best performance but no smooth transparency gradients.
   */
  CLIP = 0,

  /**
   * Hash mode - dithered transparency using screen-door transparency.
   * Creates transparency illusion through pixel patterns.
   * Good performance with better visual quality than CLIP.
   */
  HASH = 1,

  /**
   * Blend mode - true alpha blending with smooth transparency.
   * Supports full range of transparency values with smooth gradients.
   * Best visual quality but requires depth sorting and impacts performance.
   */
  BLEND = 2,
}

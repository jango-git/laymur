/** Color blending modes */
export enum UIBlendMode {
  /** Standard alpha-over compositing. */
  NORMAL = 0,
  /** Additive blending (light accumulation). Only affects BLEND transparency. */
  ADDITIVE = 1,
}

/**
 * Output-alpha multiplier of a premultiplied shader: 1 composites over the destination, 0 adds
 * to it
 */
export function blendModeToFactor(mode: UIBlendMode): number {
  return mode === UIBlendMode.ADDITIVE ? 0 : 1;
}

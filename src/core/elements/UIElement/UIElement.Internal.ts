import type { HSLAdjustment } from "../../miscellaneous/generic-plane/shared";
import { UIBlendMode } from "../../miscellaneous/UIBlendMode";
import type { UIMicroConfig } from "../../miscellaneous/micro/UIMicro.Internal";
import { UITransparencyMode } from "../../miscellaneous/UITransparencyMode";
import type { UIDummyOptions } from "../UIDummy/UIDummy.Internal";

/** Configuration options for UIElement */
export interface UIElementOptions extends UIDummyOptions {
  /** Transforms that don't affect constraints */
  micro: Partial<UIMicroConfig>;
  /** Alpha blending mode */
  transparencyMode: UITransparencyMode;
  /** Color blending mode (only affects BLEND transparency) */
  blendMode: UIBlendMode;
  /** Hue shift in degrees */
  hue: number;
  /** Saturation multiplier (1 = unchanged, 0 = grayscale) */
  saturation: number;
  /** Lightness offset (0 = unchanged) */
  lightness: number;
}

export const ELEMENT_DEFAULT_TRANSPARENCY_MODE = UITransparencyMode.BLEND;

export const ELEMENT_DEFAULT_BLEND_MODE = UIBlendMode.NORMAL;

export const ELEMENT_DEFAULT_HUE = 0;
export const ELEMENT_DEFAULT_SATURATION = 1;
export const ELEMENT_DEFAULT_LIGHTNESS = 0;

/** Maps a blend mode to the output-alpha multiplier used by the premultiplied shader. */
export function blendModeToFactor(mode: UIBlendMode): number {
  return mode === UIBlendMode.ADDITIVE ? 0 : 1;
}

/**
 * Packs HSL adjustment into the shader attribute layout (hue in turns, saturation
 * multiplier, lightness offset). Hue degrees become turns so the shader can wrap
 * them with a cheap fract().
 */
export function packHSL(
  target: HSLAdjustment,
  hue: number,
  saturation: number,
  lightness: number,
): HSLAdjustment {
  target.h = hue / 360;
  target.s = saturation;
  target.l = lightness;
  return target;
}

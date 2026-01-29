import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  UnsignedByteType,
  UVMapping,
  type Vector2Tuple,
} from "three";
import type { UIColor } from "../../core";
import type { Vector2Like } from "../../core/miscellaneous/math";
import type { UITextureConfig } from "../../core/miscellaneous/texture/UITextureView.Internal";

export interface UIRange {
  min: number;
  max: number;
}

export type UIRangeConfig = UIRange | [number, number] | number;
export type UIVector2Config = Vector2Like | Vector2Tuple | number;
export type UIAspectConfig = number | UITextureConfig;

export function resolveUIRangeConfig(config: UIRangeConfig): UIRange {
  if (typeof config === "number") {
    return { min: config, max: config };
  }

  if (Array.isArray(config)) {
    return { min: config[0], max: config[1] };
  }

  return config;
}

export function resolveUIVector2Config(config: UIVector2Config): Vector2Like {
  if (typeof config === "number") {
    return { x: config, y: config };
  }

  if (Array.isArray(config)) {
    return { x: config[0], y: config[1] };
  }

  return config;
}

export function resolveAspect(config: number | UITextureConfig): number {
  if (typeof config === "number") {
    return config;
  }

  if (config instanceof Texture) {
    return config.image.naturalWidth / config.image.naturalHeight;
  }

  return config.sourceSize.w / config.sourceSize.h;
}

export function generateNoise2D(x: number, y: number): number {
  const noise = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453123;
  return (noise - Math.floor(noise)) * 2 - 1;
}

export function buildGradientTexture(colors: UIColor[]): DataTexture {
  const width = colors.length;
  const height = 1;
  const data = new Uint8Array(width * height * 4);

  for (let i = 0; i < width; i++) {
    const color = colors[i];

    const index = i * 4;
    data[index] = Math.round(color.r * 255);
    data[index + 1] = Math.round(color.g * 255);
    data[index + 2] = Math.round(color.b * 255);
    data[index + 3] = Math.round(color.a * 255);
  }

  const texture = new DataTexture(
    data,
    width,
    height,
    RGBAFormat,
    UnsignedByteType,
    UVMapping,
    ClampToEdgeWrapping,
    ClampToEdgeWrapping,
    LinearFilter,
    LinearFilter,
    1,
    SRGBColorSpace,
  );

  texture.needsUpdate = true;
  return texture;
}

export const BUILTIN_OFFSET_POSITION_X = 0;
export const BUILTIN_OFFSET_POSITION_Y = 1;
export const BUILTIN_OFFSET_VELOCITY_X = 2;
export const BUILTIN_OFFSET_VELOCITY_Y = 3;
export const BUILTIN_OFFSET_SCALE_X = 4;
export const BUILTIN_OFFSET_SCALE_Y = 5;
export const BUILTIN_OFFSET_ROTATION = 6;
export const BUILTIN_OFFSET_TORQUE = 7;
export const BUILTIN_OFFSET_LIFETIME = 8;
export const BUILTIN_OFFSET_AGE = 9;
export const BUILTIN_OFFSET_RANDOM_A = 10;
export const BUILTIN_OFFSET_RANDOM_B = 11;
export const BUILTIN_OFFSET_RANDOM_C = 12;
export const BUILTIN_OFFSET_RANDOM_D = 13;
export const BUILTIN_OFFSET_RANDOM_E = 14;
export const BUILTIN_OFFSET_RANDOM_F = 15;

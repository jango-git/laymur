import { makeNoise2D } from "fast-simplex-noise";
import type { Vector2Tuple } from "three";
import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  Texture,
  UnsignedByteType,
  UVMapping,
} from "three";

import type { UIColor } from "../../core/index.js";
export {
  assertValidNonNegativeInteger,
  assertValidUnitNumber,
} from "../../core/miscellaneous/asserts.js";
import type { Vector2Like } from "../../core/miscellaneous/math.js";
import type { UITextureConfig } from "../../core/miscellaneous/texture/UITextureView.Internal.js";
import { getTextureImageSize } from "../../core/miscellaneous/texture/UITextureView.Internal.js";

export interface UIRange {
  min: number;
  max: number;
}

export type UIRangeConfig = UIRange | [number, number] | number;
export type UIVector2Config = Vector2Like | Vector2Tuple | number;
export type UIAspectConfig = number | UITextureConfig;

/** Easing of an interpolation between two values */
export enum UIEasing {
  /** Constant rate */
  LINEAR = 0,
  /** Starts slow, quadratic */
  IN = 1,
  /** Ends slow, quadratic */
  OUT = 2,
  /** Starts and ends slow, smoothstep */
  IN_OUT = 3,
}

/**
 * Eases an interpolation factor
 * @param t Factor in [0, 1]
 * @returns Eased factor, 0 at t = 0 and 1 at t = 1
 */
export function applyEasing(easing: UIEasing, t: number): number {
  switch (easing) {
    case UIEasing.LINEAR:
      return t;
    case UIEasing.IN:
      return t * t;
    case UIEasing.OUT:
      return t * (2 - t);
    case UIEasing.IN_OUT:
      return t * t * (3 - 2 * t);
  }
}

/** Formats a number as a GLSL float literal */
export function toGLSLFloat(value: number): string {
  const literal = String(value);
  return /[.e]/.test(literal) ? literal : `${literal}.0`;
}

/**
 * GLSL expression of a whole float in [0, count) from a fraction in [0, 1]: the index of the cell
 * the fraction falls in, the last cell taking 1
 */
export function buildIndexExpression(fraction: string, count: number): string {
  const size = toGLSLFloat(count);
  // Clamped below the count: at mediump precision a value just below it can round up to it
  return `floor(min(${fraction} * ${size}, ${size} - 0.5))`;
}

/** GLSL expression of the u that samples a gradient texture of `size` texels at t in [0, 1] */
export function buildGradientCoordinate(t: string, size: number): string {
  // Texel centers: the first stop at t = 0, the last at t = 1.
  return `${t} * ${toGLSLFloat((size - 1) / size)} + ${toGLSLFloat(0.5 / size)}`;
}

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
    const { w, h } = getTextureImageSize(config);
    return w / h;
  }

  return config.sourceSize.w / config.sourceSize.h;
}

export const generateNoise2D = makeNoise2D();

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

/** 2^24: integers below it are exact in float32, so the builtin buffer can carry a seed */
const PARTICLE_SEED_RANGE = 16777216;

/**
 * 32-bit integer hash (lowbias32 by C. Wellons). A bijection in which every input bit affects
 * every output bit. CPU only: GLSL ES 1.00 has no integer bit operations.
 * @param value Integer; taken modulo 2^32
 * @returns Unsigned 32-bit hash
 */
function hashUint32(value: number): number {
  let x = value >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

/**
 * Maps a hash to [0, 1) with 24 bits: exact in float32, so a stored value stays below 1
 * @param hash Unsigned 32-bit hash
 * @returns Uniform value in [0, 1)
 */
function hashToUnit(hash: number): number {
  return (hash >>> 8) / PARTICLE_SEED_RANGE;
}

/**
 * Seed of the particle i of an emitter: a 24-bit integer
 * @param emitterSeed Seed of the emitter
 * @param index Number of particles the emitter spawned before this one
 */
export function computeParticleSeed(emitterSeed: number, index: number): number {
  return hashUint32(emitterSeed ^ hashUint32(index)) >>> 8;
}

/**
 * Stores a particle seed in the builtin buffer. The slot doubles as `PARTICLE_RANDOM_F`: the
 * stored value seed / 2^24 is uniform in [0, 1).
 */
export function writeParticleSeed(
  array: { [index: number]: number },
  itemOffset: number,
  seed: number,
): void {
  array[itemOffset + BUILTIN_OFFSET_RANDOM_F] = seed / PARTICLE_SEED_RANGE;
}

/**
 * Stream of random values of one module: one value per particle, independent of the other
 * streams. Constant for a module, so compute it once per spawn or update call.
 * @param salt Salt the emitter gives the module
 * @param channel Index of the value within the module, below 64
 * @returns Stream key for `particleRandom`
 */
export function particleRandomStream(salt: number, channel: number): number {
  return hashUint32(Math.imul(salt, 64) + channel);
}

/**
 * Random value of a particle in a stream, constant over the particle's life
 * @param array Builtin buffer
 * @param itemOffset Offset of the particle in the builtin buffer
 * @param stream Key from `particleRandomStream`
 * @returns Uniform value in [0, 1)
 */
export function particleRandom(
  array: ArrayLike<number>,
  itemOffset: number,
  stream: number,
): number {
  const seed = Math.round(array[itemOffset + BUILTIN_OFFSET_RANDOM_F] * PARTICLE_SEED_RANGE);
  return hashToUnit(hashUint32(seed ^ stream));
}

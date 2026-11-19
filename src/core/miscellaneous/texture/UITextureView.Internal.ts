import { Texture } from "three";

export const TEXTURE_DEFAULT_TEXTURE = new Texture();
export const TEXTURE_DEFAULT_SIZE = 2;

/** Size fields of the possible texture image sources */
interface UITextureImageSize {
  /** HTMLImageElement */
  naturalWidth?: number;
  naturalHeight?: number;
  /** HTMLVideoElement */
  videoWidth?: number;
  videoHeight?: number;
  /** Canvas, OffscreenCanvas, ImageBitmap, data of a DataTexture */
  width?: number;
  height?: number;
}

/**
 * First of the sizes that is known, that is, positive.
 * @param sizes Candidate sizes in order of preference
 * @returns The size, or the default size when none is known
 */
function firstKnownSize(...sizes: (number | undefined)[]): number {
  return sizes.find((size) => size !== undefined && size > 0) ?? TEXTURE_DEFAULT_SIZE;
}

/**
 * Reads the pixel size of a texture image: an image, a video, a canvas, a bitmap
 * or the data of a DataTexture. An image or video that is not loaded yet reports 0, which is
 * taken as unknown.
 * @param texture Texture to measure
 * @returns Width and height in pixels
 */
export function getTextureImageSize(texture: Texture): UITextureSize {
  const image = texture.image as UITextureImageSize | null | undefined;
  return {
    w: firstKnownSize(image?.naturalWidth, image?.videoWidth, image?.width),
    h: firstKnownSize(image?.naturalHeight, image?.videoHeight, image?.height),
  };
}

/** Rectangle coordinates and dimensions in atlas */
export interface UITextureRect {
  /** X coordinate in pixels */
  x: number;
  /** Y coordinate in pixels */
  y: number;
  /** Width in pixels */
  w: number;
  /** Height in pixels */
  h: number;
}

/** Size dimensions */
export interface UITextureSize {
  /** Width in pixels */
  w: number;
  /** Height in pixels */
  h: number;
}

/** Transparent padding around visible content */
export interface UITextureTrim {
  /** Left padding in world units */
  left: number;
  /** Right padding in world units */
  right: number;
  /** Top padding in world units */
  top: number;
  /** Bottom padding in world units */
  bottom: number;
}

/** Configuration for texture atlas sprite */
export interface UITextureAtlasConfig {
  /** Source texture atlas */
  texture: Texture;
  /** Rectangle in atlas containing sprite */
  frame: UITextureRect;
  /** Whether sprite is rotated 90 degrees clockwise */
  rotated?: boolean;
  /** Position and size within original image before trimming */
  spriteSourceSize: UITextureRect;
  /** Original image dimensions before trimming */
  sourceSize: UITextureSize;
  /** Scale factor for resolution independence */
  scale?: number;
}

/** Texture configuration from direct texture or atlas sprite */
export type UITextureConfig = Texture | UITextureAtlasConfig;

import { Texture } from "three";

export const TEXTURE_DEFAULT_TEXTURE = new Texture();
export const TEXTURE_DEFAULT_SIZE = 2;

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

import { Texture } from "three";

export const TEXTURE_DEFAULT_TEXTURE = new Texture();
export const TEXTURE_DEFAULT_SIZE = 2;

export enum UITextureEvent {
  DIMENSIONS_CHANGED = 0,
}

export interface UITextureRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface UITextureSize {
  w: number;
  h: number;
}

export interface UITextureTrim {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface UITextureAtlasConfig {
  texture: Texture;
  frame: UITextureRect;
  rotated?: boolean;
  spriteSourceSize: UITextureRect;
  sourceSize: UITextureSize;
  scale?: number;
}

export type UITextureConfig = Texture | UITextureAtlasConfig;

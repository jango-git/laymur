import type { Vector2Like } from "three";
import { Texture } from "three";

export const TEXTURE_DEFAULT_TEXTURE = new Texture();
export const TEXTURE_DEFAULT_ROTATED = false;
export const TEXTURE_DEFAULT_SCALE = 1;

export enum UITextureEvent {
  DIMINSIONS_CHANGED = 0,
}

export interface UITextureTrim {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface UITextureAtlasConfig {
  texture: Texture;
  min: Vector2Like;
  max: Vector2Like;
  rotated?: boolean;
  scale?: number;
  padding?: UITextureTrim;
}

export type UITextureConfig = UITextureAtlasConfig | Texture;

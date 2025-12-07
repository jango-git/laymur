import { Matrix3, Texture } from "three";

const DEFAULT_TEXTURE = new Texture();

export type UITexture =
  | Texture
  | { texture: Texture; transform: Matrix3 }
  | [Texture, Matrix3];

export function resolveTexture(value: unknown): {
  texture: Texture;
  transform: Matrix3;
} {
  if (value instanceof Texture) {
    return { texture: value, transform: value.matrix };
  }

  if (Array.isArray(value)) {
    return { texture: value[0], transform: value[1] };
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "texture" in value &&
    "transform" in value &&
    value.texture instanceof Texture &&
    value.transform instanceof Matrix3
  ) {
    return { texture: value.texture, transform: value.transform };
  }

  return { texture: DEFAULT_TEXTURE, transform: new Matrix3().identity() };
}

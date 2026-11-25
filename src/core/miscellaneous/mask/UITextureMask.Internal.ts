import textureMaskSource from "../../shaders/UITextureMask.js";
import type { UIMaskOptions, UIMaskProgram } from "./UIMask.Internal.js";

/** Texture channel a texture mask reads */
export enum UITextureMaskChannel {
  RED = 0,
  GREEN = 1,
  BLUE = 2,
  ALPHA = 3,
}

/** Configuration options for UITextureMask */
export interface UITextureMaskOptions extends UIMaskOptions {
  /** Texture channel holding the mask */
  channel: UITextureMaskChannel;
  /** Mask value at the middle of the edge */
  threshold: number;
  /**
   * Width of the edge in mask values, centered on the threshold. With the threshold at 0.5, 1
   * takes the mask values as they are, and 0 cuts at the threshold, antialiased over about a
   * pixel.
   */
  softness: number;
}

export const TEXTURE_MASK_DEFAULT_CHANNEL = UITextureMaskChannel.ALPHA;
export const TEXTURE_MASK_DEFAULT_THRESHOLD = 0.5;
export const TEXTURE_MASK_DEFAULT_SOFTNESS = 1;

/**
 * Number of floats in the packed texture mask data:
 * - [0..2] first row of the affine map from the layer to the frame unit square
 * - [3..5] second row of that map
 * - [6..8] first row of the affine map from the layer to the mask texture UV
 * - [9..11] second row of that map
 * - [12..15] channel, threshold, softness, inverted (0 or 1)
 *
 * The frame unit square is the trimmed frame as stretched over the source rectangle. Outside of
 * it the mask value is 0 whatever the texture holds there.
 */
export const TEXTURE_MASK_DATA_SIZE = 16;

export const TEXTURE_MASK_DATA_ROW0_OFFSET = 0;
export const TEXTURE_MASK_DATA_ROW1_OFFSET = 3;
export const TEXTURE_MASK_DATA_UV_ROW0_OFFSET = 6;
export const TEXTURE_MASK_DATA_UV_ROW1_OFFSET = 9;
export const TEXTURE_MASK_DATA_PARAMETERS_OFFSET = 12;

export const TEXTURE_MASK_PROGRAM: UIMaskProgram = {
  name: "laymur-texture-mask",
  fields: [
    { name: "instanceMaskRow0", type: "Vector3", vertexOnly: true },
    { name: "instanceMaskRow1", type: "Vector3", vertexOnly: true },
    { name: "instanceMaskUVRow0", type: "Vector3", vertexOnly: true },
    { name: "instanceMaskUVRow1", type: "Vector3", vertexOnly: true },
    { name: "instanceMaskParameters", type: "Vector4", vertexOnly: false },
  ],
  dataSize: TEXTURE_MASK_DATA_SIZE,
  buildVertex: (read) => /* glsl */ `
    vec2 maskUnit = vec2(
      dot(${read("instanceMaskRow0")}, maskPoint),
      dot(${read("instanceMaskRow1")}, maskPoint)
    );
    vec2 maskUV = vec2(
      dot(${read("instanceMaskUVRow0")}, maskPoint),
      dot(${read("instanceMaskUVRow1")}, maskPoint)
    );
  `,
  varyings: [
    { name: "p_instanceMaskUnit", glslTypeName: "vec2", components: ["maskUnit.x", "maskUnit.y"] },
    { name: "p_instanceMaskUV", glslTypeName: "vec2", components: ["maskUV.x", "maskUV.y"] },
  ],
  fragmentSource: textureMaskSource,
  coverage:
    "laymurTextureMaskCoverage(p_instanceMaskUnit, p_instanceMaskUV, p_instanceMaskParameters)",
  textured: true,
};

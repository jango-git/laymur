import type { UIPropertyName } from "../generic-plane/shared.js";
import type { VaryingFieldSpec } from "../generic-plane/varyingPacking.js";

/** Configuration options shared by every mask */
export interface UIMaskOptions {
  /** Whether the mask keeps what is outside instead of what is inside */
  inverted: boolean;
  /** Whether the micro transform of the source moves the mask, when the source has one */
  useMicro: boolean;
}

export const MASK_DEFAULT_INVERTED = false;
export const MASK_DEFAULT_USE_MICRO = true;

/**
 * Translation that puts every point of an empty mask (a source collapsed to no area) far
 * outside of it, in world units
 */
export const MASK_EMPTY_OFFSET = 1e6;

/** Per-instance field of a mask program */
export interface UIMaskProgramField {
  /** Field name. A field the fragment shader reads is known there as p_<name> */
  name: string;
  type: Extract<UIPropertyName, "number" | "Vector2" | "Vector3" | "Vector4">;
  /** Whether only the vertex shader reads the field */
  vertexOnly: boolean;
}

/**
 * How a kind of mask is evaluated on a plane. The packed mask data holds the fields one after
 * another, in the order they are listed.
 */
export interface UIMaskProgram {
  /** Unique name, also telling the programs of different copies of laymur apart */
  name: string;
  fields: readonly UIMaskProgramField[];
  /** Number of floats in the packed mask data */
  dataSize: number;
  /** Values computed per vertex that the fragment shader reads as p_* fields */
  varyings: readonly VaryingFieldSpec[];
  /** Fragment shader declarations, uniforms and functions */
  fragmentSource: string;
  /** Fragment shader expression of the coverage, reading p_* fields */
  coverage: string;
  /** Whether the fragment source samples the mask texture as `laymurMaskTexture` */
  textured: boolean;
  /**
   * Vertex shader statements. `maskPoint` holds vec3(layer position, 1.0), and `read` gives the
   * expression of a field. The statements declare the locals the varyings read.
   */
  buildVertex(read: (name: string) => string): string;
}

/**
 * Rectangle of a mask source as drawn, in layer coordinates. The point (u, v) of its unit square
 * is origin + u * axisX + v * axisY, with (0, 0) at the bottom-left corner of the source.
 */
export interface MaskSourceFrame {
  originX: number;
  originY: number;
  axisXx: number;
  axisXy: number;
  axisYx: number;
  axisYy: number;
}

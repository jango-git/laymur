import type { IUniform, ShaderMaterial } from "three";
import { Matrix3, Matrix4, Texture, Vector2, Vector3, Vector4 } from "three";
import { UIColor } from "../UIColor";

export type UIPropertyType =
  | Texture
  | UIColor
  | Vector2
  | Vector3
  | Vector4
  | Matrix3
  | Matrix4
  | number;

export type UIPropertyTypeName =
  | "Texture"
  | "UIColor"
  | "Vector2"
  | "Vector3"
  | "Vector4"
  | "Matrix3"
  | "Matrix4"
  | "number";

interface TypeInfo {
  instantiable: boolean;
  glslType: string;
  itemSize: number;
}

export const DEFAULT_ALPHA_TEST = 0.5;
export const DEFAULT_VISIBILITY = 1;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Constructor type needs to accept any arguments for generic type mapping
const TYPE_INFO_MAP = new Map<string | (new (...args: any[]) => any), TypeInfo>(
  [
    ["Texture", { glslType: "sampler2D", instantiable: false, itemSize: -1 }],
    [Texture, { glslType: "sampler2D", instantiable: false, itemSize: -1 }],
    ["UIColor", { glslType: "vec4", instantiable: true, itemSize: 4 }],
    [UIColor, { glslType: "vec4", instantiable: true, itemSize: 4 }],
    ["Vector2", { glslType: "vec2", instantiable: true, itemSize: 2 }],
    [Vector2, { glslType: "vec2", instantiable: true, itemSize: 2 }],
    ["Vector3", { glslType: "vec3", instantiable: true, itemSize: 3 }],
    [Vector3, { glslType: "vec3", instantiable: true, itemSize: 3 }],
    ["Vector4", { glslType: "vec4", instantiable: true, itemSize: 4 }],
    [Vector4, { glslType: "vec4", instantiable: true, itemSize: 4 }],
    ["Matrix3", { glslType: "mat3", instantiable: true, itemSize: 9 }],
    [Matrix3, { glslType: "mat3", instantiable: true, itemSize: 9 }],
    ["Matrix4", { glslType: "mat4", instantiable: true, itemSize: 16 }],
    [Matrix4, { glslType: "mat4", instantiable: true, itemSize: 16 }],
    ["number", { glslType: "float", instantiable: true, itemSize: 1 }],
  ],
);

export function resolveTypeInfo(
  property: UIPropertyType | UIPropertyTypeName,
): TypeInfo {
  if (typeof property === "string") {
    const info = TYPE_INFO_MAP.get(property);
    if (info) {
      return info;
    }
  } else if (typeof property === "number") {
    const info = TYPE_INFO_MAP.get("number");
    if (info) {
      return info;
    }
  } else {
    for (const [key, info] of TYPE_INFO_MAP) {
      if (typeof key === "function" && property instanceof key) {
        return info;
      }
    }
  }
  throw new Error(`Unsupported property type: ${property}`);
}

export function resolveUniform(
  name: string,
  material: ShaderMaterial,
): IUniform<unknown> {
  const uniform = material.uniforms[`u_${name}`] as
    | IUniform<unknown>
    | undefined;
  if (uniform === undefined) {
    throw new Error(`Unknown uniform: ${name}`);
  }
  return uniform;
}

import {
  Color,
  Matrix2,
  Matrix3,
  Matrix4,
  Texture,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import { UIColor } from "./UIColor";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Constructor type needs to accept any arguments for generic type mapping
type Constructor = new (...args: any[]) => any;

const UNIFROM_TYPE_MAP = new Map<Constructor, string>([
  [UIColor, "vec4"],
  [Color, "vec3"],
  [Texture, "sampler2D"],
  [Vector2, "vec2"],
  [Vector3, "vec3"],
  [Vector4, "vec4"],
  [Matrix2, "mat2"],
  [Matrix3, "mat3"],
  [Matrix4, "mat4"],
]);

export function buildUniformDeclaraction(name: string, value: unknown): string {
  if (typeof value === "number") {
    return `uniform float ${name};`;
  }
  for (const [objectType, glslType] of UNIFROM_TYPE_MAP) {
    if (value instanceof objectType) {
      return `uniform ${glslType} ${name};`;
    }
  }
  throw new Error(`Unsupported uniform type for key "${name}"`);
}

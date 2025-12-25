import type { IUniform, ShaderMaterial } from "three";
import { Matrix3, Matrix4, Texture, Vector2, Vector3, Vector4 } from "three";
import type { UITransparencyMode } from "../UITransparencyMode";
import { UIColor } from "../color/UIColor";

export type UIProperty =
  | Texture
  | UIColor
  | Vector2
  | Vector3
  | Vector4
  | Matrix3
  | Matrix4
  | number;

export type UIPropertyName =
  | "Texture"
  | "UIColor"
  | "Vector2"
  | "Vector3"
  | "Vector4"
  | "Matrix3"
  | "Matrix4"
  | "number";

export type UIPropertyConstructor =
  | typeof Texture
  | typeof UIColor
  | typeof Vector2
  | typeof Vector3
  | typeof Vector4
  | typeof Matrix3
  | typeof Matrix4
  | NumberConstructor;

export interface GLTypeInfo {
  glslTypeName: string;
  bufferSize: number;
  instantiable: boolean;
}

export interface GLProperty {
  value: UIProperty;
  glslTypeInfo: GLTypeInfo;
}

export interface PlaneData {
  source: string;
  properties: Record<string, GLProperty>;
  transform: Matrix4;
  visibility: boolean;
  transparency: UITransparencyMode;
}

export const DEFAULT_ALPHA_TEST = 0.5;

const GLSL_TYPE_INFO_FLOAT: GLTypeInfo = Object.freeze({
  glslTypeName: "float",
  bufferSize: 1,
  instantiable: true,
} as const);

const GLSL_TYPE_INFO_SAMPLER2D: GLTypeInfo = Object.freeze({
  glslTypeName: "sampler2D",
  bufferSize: -1,
  instantiable: false,
} as const);

const GLSL_TYPE_INFO_VEC2: GLTypeInfo = Object.freeze({
  glslTypeName: "vec2",
  bufferSize: 2,
  instantiable: true,
} as const);

const GLSL_TYPE_INFO_VEC3: GLTypeInfo = Object.freeze({
  glslTypeName: "vec3",
  bufferSize: 3,
  instantiable: true,
} as const);

const GLSL_TYPE_INFO_VEC4: GLTypeInfo = Object.freeze({
  glslTypeName: "vec4",
  bufferSize: 4,
  instantiable: true,
} as const);

const GLSL_TYPE_INFO_MAT3: GLTypeInfo = Object.freeze({
  glslTypeName: "mat3",
  bufferSize: 9,
  instantiable: true,
} as const);

const GLSL_TYPE_INFO_MAT4: GLTypeInfo = Object.freeze({
  glslTypeName: "mat4",
  bufferSize: 16,
  instantiable: true,
} as const);

export function resolveGLSLTypeInfo(
  value: UIProperty | UIPropertyName | UIPropertyConstructor,
): GLTypeInfo {
  if (typeof value === "string") {
    switch (value) {
      case "number":
        return GLSL_TYPE_INFO_FLOAT;
      case "Texture":
        return GLSL_TYPE_INFO_SAMPLER2D;
      case "UIColor":
        return GLSL_TYPE_INFO_VEC4;
      case "Vector2":
        return GLSL_TYPE_INFO_VEC2;
      case "Vector3":
        return GLSL_TYPE_INFO_VEC3;
      case "Vector4":
        return GLSL_TYPE_INFO_VEC4;
      case "Matrix3":
        return GLSL_TYPE_INFO_MAT3;
      case "Matrix4":
        return GLSL_TYPE_INFO_MAT4;
      default:
        throw new Error(
          `resolveGLSLTypeInfo.value: unsupported property type name`,
        );
    }
  }
  if (typeof value === "function") {
    if (value === Number) {
      return GLSL_TYPE_INFO_FLOAT;
    }
    if (value === Texture) {
      return GLSL_TYPE_INFO_SAMPLER2D;
    }
    if (value === UIColor) {
      return GLSL_TYPE_INFO_VEC4;
    }
    if (value === Vector2) {
      return GLSL_TYPE_INFO_VEC2;
    }
    if (value === Vector3) {
      return GLSL_TYPE_INFO_VEC3;
    }
    if (value === Vector4) {
      return GLSL_TYPE_INFO_VEC4;
    }
    if (value === Matrix3) {
      return GLSL_TYPE_INFO_MAT3;
    }
    if (value === Matrix4) {
      return GLSL_TYPE_INFO_MAT4;
    }
    throw new Error(
      `resolveGLSLTypeInfo.value: unsupported property type constructor`,
    );
  }
  if (typeof value === "number") {
    return GLSL_TYPE_INFO_FLOAT;
  }
  if (value instanceof Texture) {
    return GLSL_TYPE_INFO_SAMPLER2D;
  }
  if (value instanceof UIColor) {
    return GLSL_TYPE_INFO_VEC4;
  }
  if (value instanceof Vector2) {
    return GLSL_TYPE_INFO_VEC2;
  }
  if (value instanceof Vector3) {
    return GLSL_TYPE_INFO_VEC3;
  }
  if (value instanceof Vector4) {
    return GLSL_TYPE_INFO_VEC4;
  }
  if (value instanceof Matrix3) {
    return GLSL_TYPE_INFO_MAT3;
  }
  if (value instanceof Matrix4) {
    return GLSL_TYPE_INFO_MAT4;
  }
  throw new Error(`resolveGLSLTypeInfo.value: unsupported property type`);
}

export function resolvePropertyUniform(
  name: string,
  material: ShaderMaterial,
): IUniform<UIProperty> {
  const uniform = material.uniforms[`p_${name}`] as
    | IUniform<UIProperty>
    | undefined;
  if (uniform === undefined) {
    throw new Error(`resolveUniform.name: unknown uniform`);
  }
  return uniform;
}

export function arePropertiesPartiallyCompatible(
  full: Readonly<Record<string, Readonly<GLProperty>>>,
  partial: Readonly<Record<string, Readonly<GLProperty>>>,
): boolean {
  for (const key in partial) {
    if (!(key in full)) {
      return false;
    }

    const infoFull = full[key].glslTypeInfo;
    const infoPartial = partial[key].glslTypeInfo;

    if (infoFull.glslTypeName !== infoPartial.glslTypeName) {
      return false;
    }

    // Non-instantiable (textures) must match by reference
    if (!infoFull.instantiable && full[key] !== partial[key]) {
      return false;
    }
  }

  return true;
}

export function convertUIPropertiesToGLProperties(
  uiProperties: Record<string, UIProperty>,
): Record<string, GLProperty> {
  const glProperties: Record<string, GLProperty> = {};

  for (const name in uiProperties) {
    const value = uiProperties[name];
    glProperties[name] = { value, glslTypeInfo: resolveGLSLTypeInfo(value) };
  }

  return glProperties;
}

export function buildGenericPlaneFragmentShader(
  uniformDeclarations: string[],
  varyingDeclarations: string[],
  source: string,
): string {
  return `
    // Defines
    #define PI 3.14159265359

    // Uniforms
    ${uniformDeclarations.join("\n")}

    // Builtin varyings
    varying vec3 p_position;
    varying vec2 p_uv;

    // User varyings
    ${varyingDeclarations.join("\n")}

    #include <alphahash_pars_fragment>

    // Source must define vec4 draw() function
    ${source}

    void main() {
      vec4 diffuseColor = draw();

      #ifdef USE_ALPHATEST
        if (diffuseColor.a < ${DEFAULT_ALPHA_TEST.toFixed(2)}) {
          discard;
        }
      #endif

      #ifdef USE_ALPHAHASH
        if (diffuseColor.a < getAlphaHashThreshold(p_position)) {
          discard;
        }
      #endif

      gl_FragColor = linearToOutputTexel(diffuseColor);
    }
  `;
}

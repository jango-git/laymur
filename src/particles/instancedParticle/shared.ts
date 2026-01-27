import type { IUniform, ShaderMaterial } from "three";
import { Matrix3, Matrix4, Texture, Vector2, Vector3, Vector4 } from "three";
import { UIColor } from "../../core";
import { checkSRGBSupport } from "../../core/miscellaneous/webglCapabilities";

export interface PropertyTypeMap {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Texture: Texture;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  UIColor: UIColor;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Vector2: Vector2;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Vector3: Vector3;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Vector4: Vector4;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Matrix3: Matrix3;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Matrix4: Matrix4;
  number: number;
}

export function collectProperties(
  target: Record<string, UIParticlePropertyName>,
  modules: readonly { requiredProperties?: Record<string, UIParticlePropertyName> }[],
  context: string,
): void {
  for (const module of modules) {
    if (module.requiredProperties !== undefined) {
      for (const [key, propName] of Object.entries(module.requiredProperties)) {
        const existing = target[key] as UIParticlePropertyName | undefined;
        if (existing !== undefined) {
          if (
            resolveGLSLTypeInfo(existing).glslTypeName !==
            resolveGLSLTypeInfo(propName).glslTypeName
          ) {
            throw new Error(`${context}: property conflict for "${key}"`);
          }
        } else {
          target[key] = propName;
        }
      }
    }
  }
}

export function collectUniforms(
  target: Record<string, UIParticleProperty>,
  modules: readonly { requiredUniforms: Record<string, UIParticleProperty> }[],
  context: string,
): void {
  for (const module of modules) {
    for (const [key, propName] of Object.entries(module.requiredUniforms)) {
      const existing = target[key] as UIParticleProperty | undefined;
      if (existing !== undefined) {
        if (
          resolveGLSLTypeInfo(existing).glslTypeName !== resolveGLSLTypeInfo(propName).glslTypeName
        ) {
          throw new Error(`${context}: property conflict for "${key}"`);
        }
      } else {
        target[key] = propName;
      }
    }
  }
}

export function callbackPlaceholder(): boolean {
  return false;
}

export type UIParticleProperty =
  | Texture
  | UIColor
  | Vector2
  | Vector3
  | Vector4
  | Matrix3
  | Matrix4
  | number;

export type UIParticlePropertyName =
  | "Texture"
  | "UIColor"
  | "Vector2"
  | "Vector3"
  | "Vector4"
  | "Matrix3"
  | "Matrix4"
  | "number";

export type UIParticlePropertyConstructor =
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
  value: UIParticleProperty;
  glslTypeInfo: GLTypeInfo;
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

export function createDefaultPropertyValue(
  propertyName: UIParticlePropertyName,
): UIParticleProperty {
  switch (propertyName) {
    case "number":
      return 0;
    case "Texture":
      throw new Error("createDefaultPropertyValue: Texture has no default value");
    case "UIColor":
      return new UIColor(0, 0, 0, 1);
    case "Vector2":
      return new Vector2(0, 0);
    case "Vector3":
      return new Vector3(0, 0, 0);
    case "Vector4":
      return new Vector4(0, 0, 0, 0);
    case "Matrix3":
      return new Matrix3();
    case "Matrix4":
      return new Matrix4();
    default:
      throw new Error(`createDefaultPropertyValue: unsupported property type name`);
  }
}

export function createDefaultProperties<T extends Record<string, UIParticlePropertyName>>(
  propertyNames: T,
): { [K in keyof T]: UIParticleProperty } {
  const result: Record<string, UIParticleProperty> = {};
  for (const key in propertyNames) {
    result[key] = createDefaultPropertyValue(propertyNames[key]);
  }
  return result as { [K in keyof T]: UIParticleProperty };
}

export function resolveGLSLTypeInfo(
  value: UIParticleProperty | UIParticlePropertyName | UIParticlePropertyConstructor,
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
        throw new Error(`resolveGLSLTypeInfo.value: unsupported property type name`);
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
    throw new Error(`resolveGLSLTypeInfo.value: unsupported property type constructor`);
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
): IUniform<UIParticleProperty> {
  const uniform = material.uniforms[`p_${name}`] as IUniform<UIParticleProperty> | undefined;
  if (uniform === undefined) {
    throw new Error(`resolvePropertyUniform.name: unknown uniform '${name}'`);
  }
  return uniform;
}

export function convertUIPropertiesToGLProperties(
  uiProperties: Record<string, UIParticleProperty>,
): Record<string, GLProperty> {
  const glProperties: Record<string, GLProperty> = {};

  for (const name in uiProperties) {
    const value = uiProperties[name];
    glProperties[name] = { value, glslTypeInfo: resolveGLSLTypeInfo(value) };
  }

  return glProperties;
}

export function cloneProperty<T extends UIParticleProperty>(property: T): T {
  if (typeof property === "number" || property instanceof Texture) {
    return property;
  }

  return property.clone() as T;
}

export function cloneProperties(
  properties: Record<string, UIParticleProperty>,
): Record<string, UIParticleProperty> {
  const result: Record<string, UIParticleProperty> = {};
  for (const name in properties) {
    result[name] = cloneProperty(properties[name]);
  }
  return result;
}

export function buildGenericPlaneFragmentShader(
  uniformDeclarations: string[],
  varyingDeclarations: string[],
  sources: string[],
): string {
  const renamedSources = sources.map((source, index) => {
    return source.replace(/vec4\s+draw\s*\(\s*\)/g, `vec4 draw${index}()`);
  });

  let drawCalls = "";
  for (let i = 0; i < sources.length; i++) {
    drawCalls += i !== 0 ? " * " : "";
    drawCalls += `draw${i}()`;
  }

  return `
    // Defines
    #define PI 3.14159265359
    #define SRGB_SUPPORTED ${checkSRGBSupport() ? "1" : "0"}

    // Uniforms
    ${uniformDeclarations.join("\n")}

    // Builtin varyings
    varying vec2 p_uv;

    // User varyings
    ${varyingDeclarations.join("\n")}

    #include <alphahash_pars_fragment>

    // sRGB decode helper
    vec4 srgbTexture2D(sampler2D textureSampler, vec2 uv) {
      #if SRGB_SUPPORTED
        return texture2D(textureSampler, uv);
      #else
        vec4 textureValue = texture2D(textureSampler, uv);
        return vec4(pow(textureValue.rgb, vec3(2.2)), textureValue.a);
      #endif
    }

    // Source must define vec4 draw() function
    ${renamedSources.join("\n")}

    void main() {
      vec4 color = ${drawCalls};
      gl_FragColor = linearToOutputTexel(color);
    }
  `;
}

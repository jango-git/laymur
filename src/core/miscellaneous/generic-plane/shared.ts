import type { IUniform, ShaderMaterial } from "three";
import { Matrix3, Matrix4, Texture, Vector2, Vector3, Vector4 } from "three";
import type { UITransparencyMode } from "../UITransparencyMode";
import { UIColor } from "../color/UIColor";
import { checkSRGBSupport } from "../webglCapabilities";

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

export type UIPropertyCopyTo = UIColor | Vector2 | Vector3 | Vector4 | Matrix3 | Matrix4;

export type UIPropertyCopyFrom = UIColor & Vector2 & Vector3 & Vector4 & Matrix3 & Matrix4;

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

/** Per-instance HSL adjustment in shader space (matches the instanceHSL attribute). */
export interface HSLAdjustment {
  /** Hue shift in turns (degrees / 360); wrapped with fract() in the shader. */
  h: number;
  /** Saturation multiplier. */
  s: number;
  /** Lightness offset. */
  l: number;
}

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
): IUniform<UIProperty> {
  const uniform = material.uniforms[`p_${name}`] as IUniform<UIProperty> | undefined;
  if (uniform === undefined) {
    throw new Error(`resolvePropertyUniform.name: unknown uniform`);
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

    if (!infoFull.instantiable && full[key].value !== partial[key].value) {
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

export function cloneProperty<T extends UIProperty>(property: T): T {
  if (typeof property === "number" || property instanceof Texture) {
    return property;
  }

  return property.clone() as T;
}

export function cloneProperties(
  properties: Record<string, UIProperty>,
): Record<string, UIProperty> {
  const result: Record<string, UIProperty> = {};
  for (const name in properties) {
    result[name] = cloneProperty(properties[name]);
  }
  return result;
}

export function cloneGLProperties(
  properties: Record<string, GLProperty>,
): Record<string, GLProperty> {
  const result: Record<string, GLProperty> = {};
  for (const name in properties) {
    const prop = properties[name];
    result[name] = {
      value: cloneProperty(prop.value),
      glslTypeInfo: prop.glslTypeInfo,
    };
  }
  return result;
}

/** Extracts zIndex from transform matrix (translation.z component) */
export function extractZIndex(transform: Matrix4): number {
  return transform.elements[14];
}

/** Extracts zIndex from transform buffer at given instance index */
export function extractZIndexFromBuffer(buffer: Float32Array, instanceIndex: number): number {
  return buffer[instanceIndex * 16 + 14];
}

export function buildGenericPlaneFragmentShader(
  uniformDeclarations: string[],
  varyingDeclarations: string[],
  source: string,
  alphaTestValue: number,
  usePremultipliedAlpha: boolean,
): string {
  return `
    // Defines
    #define PI 3.14159265359
    #define SRGB_SUPPORTED ${checkSRGBSupport() ? "1" : "0"}

    // Uniforms
    ${uniformDeclarations.join("\n")}

    // Builtin varyings
    varying vec3 p_position;
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

    // HSL adjustment helpers.
    // p_instanceHSL = (hue in turns, saturation multiplier, lightness offset).
    vec3 rgbToHsl(vec3 color) {
      float maxChannel = max(color.r, max(color.g, color.b));
      float minChannel = min(color.r, min(color.g, color.b));
      float chroma = maxChannel - minChannel;
      float lightness = (maxChannel + minChannel) * 0.5;
      float hue = 0.0;
      float saturation = 0.0;
      if (chroma > 0.0) {
        saturation = lightness > 0.5
          ? chroma / (2.0 - maxChannel - minChannel)
          : chroma / (maxChannel + minChannel);
        if (maxChannel == color.r) {
          hue = (color.g - color.b) / chroma + (color.g < color.b ? 6.0 : 0.0);
        } else if (maxChannel == color.g) {
          hue = (color.b - color.r) / chroma + 2.0;
        } else {
          hue = (color.r - color.g) / chroma + 4.0;
        }
        hue /= 6.0;
      }
      return vec3(hue, saturation, lightness);
    }

    float hueToRgbChannel(float low, float high, float hue) {
      hue = fract(hue);
      if (hue < 1.0 / 6.0) return low + (high - low) * 6.0 * hue;
      if (hue < 1.0 / 2.0) return high;
      if (hue < 2.0 / 3.0) return low + (high - low) * (2.0 / 3.0 - hue) * 6.0;
      return low;
    }

    vec3 hslToRgb(vec3 hsl) {
      float hue = hsl.x;
      float saturation = hsl.y;
      float lightness = hsl.z;
      if (saturation <= 0.0) {
        return vec3(lightness);
      }
      float high = lightness < 0.5
        ? lightness * (1.0 + saturation)
        : lightness + saturation - lightness * saturation;
      float low = 2.0 * lightness - high;
      return vec3(
        hueToRgbChannel(low, high, hue + 1.0 / 3.0),
        hueToRgbChannel(low, high, hue),
        hueToRgbChannel(low, high, hue - 1.0 / 3.0)
      );
    }

    vec3 applyInstanceHSL(vec3 color) {
      vec3 hsl = rgbToHsl(color);
      hsl.x = fract(hsl.x + p_instanceHSL.x);
      hsl.y = clamp(hsl.y * p_instanceHSL.y, 0.0, 1.0);
      hsl.z = clamp(hsl.z + p_instanceHSL.z, 0.0, 1.0);
      return hslToRgb(hsl);
    }

    // Source must define vec4 draw() function
    ${source}
    void main() {
      vec4 diffuseColor = draw();

      // Skip the HSL roundtrip entirely for the default (identity) case.
      if (p_instanceHSL != vec3(0.0, 1.0, 0.0)) {
        diffuseColor.rgb = applyInstanceHSL(diffuseColor.rgb);
      }

      if (diffuseColor.a <= ${alphaTestValue.toFixed(8)}) {
        discard;
      }
      #ifdef USE_ALPHAHASH
        if (diffuseColor.a < getAlphaHashThreshold(p_position)) {
          discard;
        }
      #endif

      gl_FragColor = linearToOutputTexel(diffuseColor);
      gl_FragColor = ${usePremultipliedAlpha ? "vec4(gl_FragColor.rgb * gl_FragColor.a, gl_FragColor.a * p_instanceBlend)" : "gl_FragColor"};
    }
  `;
}

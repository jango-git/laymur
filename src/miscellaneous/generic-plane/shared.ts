import type { IUniform, ShaderMaterial } from "three";
import { Matrix3, Matrix4, Texture, Vector2, Vector3, Vector4 } from "three";
import type { UITransparencyMode } from "../UITransparencyMode";
import { UIColor } from "../color/UIColor";

export type UIPropertyType =
  | Texture
  | UIColor
  | Vector2
  | Vector3
  | Vector4
  | Matrix3
  | Matrix4
  | number;

export interface GLSLTypeInfo {
  instantiable: boolean;
  glslType: string;
  itemSize: number;
}

export interface GenericPlaneData {
  source: string;
  properties: Record<string, UIPropertyType>;
  transparency: UITransparencyMode;
  transform: Matrix4;
  visibility: boolean;
}

export const DEFAULT_ALPHA_TEST = 0.5;

export function resolveGLSLTypeInfo(value: UIPropertyType): GLSLTypeInfo {
  if (typeof value === "number") {
    return { glslType: "float", instantiable: true, itemSize: 1 };
  }
  if (value instanceof Texture) {
    return { glslType: "sampler2D", instantiable: false, itemSize: -1 };
  }
  if (value instanceof UIColor) {
    return { glslType: "vec4", instantiable: true, itemSize: 4 };
  }
  if (value instanceof Vector2) {
    return { glslType: "vec2", instantiable: true, itemSize: 2 };
  }
  if (value instanceof Vector3) {
    return { glslType: "vec3", instantiable: true, itemSize: 3 };
  }
  if (value instanceof Vector4) {
    return { glslType: "vec4", instantiable: true, itemSize: 4 };
  }
  if (value instanceof Matrix3) {
    return { glslType: "mat3", instantiable: true, itemSize: 9 };
  }
  if (value instanceof Matrix4) {
    return { glslType: "mat4", instantiable: true, itemSize: 16 };
  }
  throw new Error(`Unsupported property type: ${value}`);
}

export function resolveUniform(
  name: string,
  material: ShaderMaterial,
): IUniform<unknown> {
  const uniform = material.uniforms[`p_${name}`] as
    | IUniform<unknown>
    | undefined;
  if (uniform === undefined) {
    throw new Error(`Unknown uniform: ${name}`);
  }
  return uniform;
}

export function arePropertiesCompatible(
  currentProperties: Record<string, UIPropertyType>,
  newProperties: Record<string, UIPropertyType>,
): boolean {
  const currentKeys = Object.keys(currentProperties);
  const newKeys = Object.keys(newProperties);

  if (currentKeys.length !== newKeys.length) {
    return false;
  }

  for (const newKey of newKeys) {
    if (!(newKey in currentProperties)) {
      return false;
    }

    const currentInfo = resolveGLSLTypeInfo(currentProperties[newKey]);
    const newInfo = resolveGLSLTypeInfo(newProperties[newKey]);

    if (currentInfo.glslType !== newInfo.glslType) {
      return false;
    }

    // Non-instantiable (textures) must match by reference
    if (
      !newInfo.instantiable &&
      newProperties[newKey] !== currentProperties[newKey]
    ) {
      return false;
    }
  }

  return true;
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

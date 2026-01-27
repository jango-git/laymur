import type { Matrix3, Matrix4, Texture, Vector2, Vector3, Vector4 } from "three";
import type { UIColor } from "../../core";
import {
  resolveGLSLTypeInfo,
  type GLProperty,
  type GLTypeInfo,
  type UIProperty,
  type UIPropertyName,
} from "../../core/miscellaneous/generic-plane/shared";
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
  keeper: Record<string, GLTypeInfo>,
  modules: readonly { requiredProperties?: Record<string, UIPropertyName> }[],
  context: string,
): void {
  for (const module of modules) {
    if (module.requiredProperties === undefined) {
      continue;
    }

    for (const key in module.requiredProperties) {
      const existingTypeInfo = keeper[key] as GLTypeInfo | undefined;
      const newTypeInfo = resolveGLSLTypeInfo(module.requiredProperties[key]);

      if (existingTypeInfo === undefined) {
        keeper[key] = newTypeInfo;
      } else if (existingTypeInfo.glslTypeName !== newTypeInfo.glslTypeName) {
        throw new Error(`${context}: property conflict for "${key}"`);
      }
    }
  }
}

export function collectUniforms(
  keeper: Record<string, GLProperty>,
  modules: readonly { requiredUniforms: Record<string, UIProperty> }[],
  context: string,
): void {
  for (const module of modules) {
    for (const key in module.requiredUniforms) {
      const value = module.requiredUniforms[key];
      const existingGLProperty = keeper[key] as GLProperty | undefined;
      const newPropertyTypeInfo = resolveGLSLTypeInfo(value);

      if (existingGLProperty === undefined) {
        keeper[key] = { value, glslTypeInfo: newPropertyTypeInfo };
      } else if (
        existingGLProperty.glslTypeInfo.glslTypeName !== newPropertyTypeInfo.glslTypeName
      ) {
        throw new Error(`${context}: property conflict for "${key}"`);
      }
    }
  }
}

export function callbackPlaceholder(): boolean {
  return false;
}

export function buildParticleFragmentShader(
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
      if (color.a < 0.001) {
        discard;
      }
      gl_FragColor = linearToOutputTexel(color);
    }
  `;
}

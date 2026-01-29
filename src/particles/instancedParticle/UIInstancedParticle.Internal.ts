import {
  BufferAttribute,
  Float32BufferAttribute,
  InstancedBufferGeometry,
  ShaderMaterial,
} from "three";
import { UIColor } from "../../core";
import type { GLProperty, GLTypeInfo } from "../../core/miscellaneous/generic-plane/shared";
import {
  resolveGLSLTypeInfo,
  type UIProperty,
  type UIPropertyName,
} from "../../core/miscellaneous/generic-plane/shared";
import { checkSRGBSupport } from "../../core/miscellaneous/webglCapabilities";

export const INSTANCED_PARTICLE_GEOMETRY = ((): InstancedBufferGeometry => {
  const geometry = new InstancedBufferGeometry();

  const indices = new Uint16Array([0, 2, 1, 2, 3, 1]);
  geometry.setIndex(new BufferAttribute(indices, 1));

  const positions = new Float32Array([-0.5, 0.5, 0, 0.5, 0.5, 0, -0.5, -0.5, 0, 0.5, -0.5, 0]);
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

  const uvs = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  return geometry;
})();

export function collectProperties(
  keeper: Record<string, GLTypeInfo>,
  modules: readonly { requiredProperties?: Record<string, UIPropertyName> }[],
  debugContext: string,
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
        throw new Error(`${debugContext}: property conflict for "${key}"`);
      }
    }
  }
}

export function collectUniforms(
  keeper: Record<string, GLProperty>,
  modules: readonly { requiredUniforms: Record<string, UIProperty> }[],
  debugContext: string,
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
        throw new Error(`${debugContext}: property conflict for "${key}"`);
      }
    }
  }
}

export function buildParticleVertexShader(
  uniformDeclarations: string[],
  attributeDeclarations: string[],
  varyingDeclarations: string[],
  vertexAssignments: string[],
): string {
  return `

    #define PARTICLE_POSITION_X a_builtin[0][0]
    #define PARTICLE_POSITION_Y a_builtin[0][1]

    #define PARTICLE_VELOCITY_X a_builtin[0][2]
    #define PARTICLE_VELOCITY_Y a_builtin[0][3]

    #define PARTICLE_SCALE_X a_builtin[1][0]
    #define PARTICLE_SCALE_Y a_builtin[1][1]

    #define PARTICLE_ROTATION a_builtin[1][2]
    #define PARTICLE_TORQUE a_builtin[1][3]

    #define PARTICLE_LIFETIME a_builtin[2][0]
    #define PARTICLE_AGE a_builtin[2][1]

    #define PARTICLE_RANDOM_X a_builtin[2][2]
    #define PARTICLE_RANDOM_Y a_builtin[2][3]
    #define PARTICLE_RANDOM_Z a_builtin[3][0]

    #define PARTICLE_RESERVED_X a_builtin[3][1]
    #define PARTICLE_RESERVED_Y a_builtin[3][2]
    #define PARTICLE_RESERVED_Z a_builtin[3][3]

    // User attributes
    ${attributeDeclarations.join("\n")}

    // Uniforms
    ${uniformDeclarations.join("\n")}

    // Builtin varyings
    varying vec2 p_uv;

    // User varyings
    ${varyingDeclarations.join("\n")}

    void main() {
      ${vertexAssignments.join("\n")}

      p_uv = uv;

      vec2 transformedPosition = position.xy;
      transformedPosition.x *= PARTICLE_SCALE_X;
      transformedPosition.y *= PARTICLE_SCALE_Y;

      float cosR = cos(PARTICLE_ROTATION);
      float sinR = sin(PARTICLE_ROTATION);

      transformedPosition = vec2(
        transformedPosition.x * cosR - transformedPosition.y * sinR,
        transformedPosition.x * sinR + transformedPosition.y * cosR
      );

      transformedPosition.x += PARTICLE_POSITION_X;
      transformedPosition.y += PARTICLE_POSITION_Y;

      transformedPosition += p_origin;
      gl_Position = projectionMatrix * vec4(transformedPosition, position.z, 1.0);
    }
  `;
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

    #define PARTICLE_POSITION_X p_builtin[0][0]
    #define PARTICLE_POSITION_Y p_builtin[0][1]

    #define PARTICLE_VELOCITY_X p_builtin[0][2]
    #define PARTICLE_VELOCITY_Y p_builtin[0][3]

    #define PARTICLE_SCALE_X p_builtin[1][0]
    #define PARTICLE_SCALE_Y p_builtin[1][1]

    #define PARTICLE_ROTATION p_builtin[1][2]
    #define PARTICLE_TORQUE p_builtin[1][3]

    #define PARTICLE_LIFETIME p_builtin[2][0]
    #define PARTICLE_AGE p_builtin[2][1]

    #define PARTICLE_RANDOM_X p_builtin[2][2]
    #define PARTICLE_RANDOM_Y p_builtin[2][3]
    #define PARTICLE_RANDOM_Z p_builtin[3][0]

    #define PARTICLE_RESERVED_X p_builtin[3][1]
    #define PARTICLE_RESERVED_Y p_builtin[3][2]
    #define PARTICLE_RESERVED_Z p_builtin[3][3]

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
      vec4 diffuseColor = ${drawCalls};
      if (diffuseColor.a < 0.0035) {
        discard;
      }
      #ifdef USE_ALPHAHASH
        if (diffuseColor.a < getAlphaHashThreshold(p_position)) {
          discard;
        }
      #endif
      gl_FragColor = linearToOutputTexel(diffuseColor);
    }
  `;
}

export function buildParticleMaterial(
  sources: string[],
  uniformProperties: Record<string, GLProperty>,
  varyingProperties: Record<string, GLTypeInfo>,
): ShaderMaterial {
  const uniforms: Record<string, { value: unknown }> = {};

  const uniformDeclarations: string[] = [];
  const attributeDeclarations: string[] = [];
  const varyingDeclarations: string[] = [];
  const vertexAssignments: string[] = [];

  for (const name in uniformProperties) {
    const { value, glslTypeInfo } = uniformProperties[name];
    uniforms[`p_${name}`] = { value: value instanceof UIColor ? value.toGLSLColor() : value };
    uniformDeclarations.push(`uniform ${glslTypeInfo.glslTypeName} p_${name};`);
  }

  for (const name in varyingProperties) {
    const { glslTypeName } = varyingProperties[name];
    attributeDeclarations.push(`attribute ${glslTypeName} a_${name};`);
    varyingDeclarations.push(`varying ${glslTypeName} p_${name};`);
    vertexAssignments.push(`p_${name} = a_${name};`);
  }

  return new ShaderMaterial({
    uniforms,
    vertexShader: buildParticleVertexShader(
      uniformDeclarations,
      attributeDeclarations,
      varyingDeclarations,
      vertexAssignments,
    ),
    fragmentShader: buildParticleFragmentShader(uniformDeclarations, varyingDeclarations, sources),
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });
}

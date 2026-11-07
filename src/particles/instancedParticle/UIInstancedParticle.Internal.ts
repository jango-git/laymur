import {
  BufferAttribute,
  DoubleSide,
  Float32BufferAttribute,
  InstancedBufferGeometry,
  ShaderMaterial,
} from "three";
import { UIColor } from "../../core/index.js";
import type {
  GLProperty,
  GLTypeInfo,
  UIProperty,
  UIPropertyName,
} from "../../core/miscellaneous/generic-plane/shared.js";
import { resolveGLSLTypeInfo } from "../../core/miscellaneous/generic-plane/shared.js";
import type { VaryingFieldSpec } from "../../core/miscellaneous/generic-plane/varyingPacking.js";
import {
  isIdentifierReferenced,
  packVaryings,
} from "../../core/miscellaneous/generic-plane/varyingPacking.js";
import { checkSRGBSupport } from "../../core/miscellaneous/webglCapabilities.js";
import {
  BUILTIN_OFFSET_AGE,
  BUILTIN_OFFSET_LIFETIME,
  BUILTIN_OFFSET_POSITION_X,
  BUILTIN_OFFSET_POSITION_Y,
  BUILTIN_OFFSET_RANDOM_A,
  BUILTIN_OFFSET_RANDOM_B,
  BUILTIN_OFFSET_RANDOM_C,
  BUILTIN_OFFSET_RANDOM_D,
  BUILTIN_OFFSET_RANDOM_E,
  BUILTIN_OFFSET_RANDOM_F,
  BUILTIN_OFFSET_ROTATION,
  BUILTIN_OFFSET_SCALE_X,
  BUILTIN_OFFSET_SCALE_Y,
  BUILTIN_OFFSET_TORQUE,
  BUILTIN_OFFSET_VELOCITY_X,
  BUILTIN_OFFSET_VELOCITY_Y,
} from "../miscellaneous/miscellaneous.js";

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

const BUILTIN_PROPERTY = "builtin";

/** Macros of the builtin particle values and their offsets in the builtin mat4 */
const PARTICLE_BUILTIN_MACROS: readonly (readonly [string, number])[] = [
  ["PARTICLE_POSITION_X", BUILTIN_OFFSET_POSITION_X],
  ["PARTICLE_POSITION_Y", BUILTIN_OFFSET_POSITION_Y],
  ["PARTICLE_VELOCITY_X", BUILTIN_OFFSET_VELOCITY_X],
  ["PARTICLE_VELOCITY_Y", BUILTIN_OFFSET_VELOCITY_Y],
  ["PARTICLE_SCALE_X", BUILTIN_OFFSET_SCALE_X],
  ["PARTICLE_SCALE_Y", BUILTIN_OFFSET_SCALE_Y],
  ["PARTICLE_ROTATION", BUILTIN_OFFSET_ROTATION],
  ["PARTICLE_TORQUE", BUILTIN_OFFSET_TORQUE],
  ["PARTICLE_LIFETIME", BUILTIN_OFFSET_LIFETIME],
  ["PARTICLE_AGE", BUILTIN_OFFSET_AGE],
  ["PARTICLE_RANDOM_A", BUILTIN_OFFSET_RANDOM_A],
  ["PARTICLE_RANDOM_B", BUILTIN_OFFSET_RANDOM_B],
  ["PARTICLE_RANDOM_C", BUILTIN_OFFSET_RANDOM_C],
  ["PARTICLE_RANDOM_D", BUILTIN_OFFSET_RANDOM_D],
  ["PARTICLE_RANDOM_E", BUILTIN_OFFSET_RANDOM_E],
  ["PARTICLE_RANDOM_F", BUILTIN_OFFSET_RANDOM_F],
];

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
      if (newTypeInfo.affine === true) {
        throw new Error(
          `${debugContext}: "${key}" cannot be UIAffineMatrix3 per particle, use Matrix3`,
        );
      }

      if (existingTypeInfo === undefined) {
        keeper[key] = newTypeInfo;
      } else if (existingTypeInfo.glslTypeName !== newTypeInfo.glslTypeName) {
        throw new Error(
          `${debugContext}: property conflict for "${key}" (${existingTypeInfo.glslTypeName} and ${newTypeInfo.glslTypeName})`,
        );
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
        throw new Error(
          `${debugContext}: uniform conflict for "${key}" (${existingGLProperty.glslTypeInfo.glslTypeName} and ${newPropertyTypeInfo.glslTypeName})`,
        );
      }
    }
  }
}

function builtinComponent(base: string, index: number): string {
  return `${base}[${Math.floor(index / 4)}].${"xyzw"[index % 4]}`;
}

function buildBuiltinMacros(base: string): string {
  return PARTICLE_BUILTIN_MACROS.map(
    ([name, index]) => `#define ${name} ${builtinComponent(base, index)}`,
  ).join("\n");
}

export function buildParticleVertexShader(
  uniformDeclarations: string[],
  attributeDeclarations: string[],
  varyingDeclarations: string[],
  vertexAssignments: string[],
): string {
  return `
    ${buildBuiltinMacros("a_builtin")}

    // User attributes
    ${attributeDeclarations.join("\n")}

    // Uniforms
    ${uniformDeclarations.join("\n")}

    // Packed varyings
    ${varyingDeclarations.join("\n")}

    void main() {
      ${vertexAssignments.join("\n")}

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

/**
 * Builds the fragment shader of a particle mesh. Sources read particle values through the
 * PARTICLE_* macros and properties as p_* globals, all filled from packed varyings.
 * @param fieldDeclarations Packed varyings, p_* globals and PARTICLE_* macros
 * @param fieldAssignments Statements filling the p_* globals at the start of main
 */
export function buildParticleFragmentShader(
  uniformDeclarations: string[],
  fieldDeclarations: string[],
  fieldAssignments: string[],
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

    // Packed varyings and the fields read from them
    ${fieldDeclarations.join("\n")}

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
      ${fieldAssignments.join("\n")}

      vec4 diffuseColor = ${drawCalls};
      if (diffuseColor.a < 0.0035) {
        discard;
      }
      gl_FragColor = linearToOutputTexel(diffuseColor);
    }
  `;
}

export function buildParticleMaterial(
  sources: string[],
  uniformProperties: Record<string, GLProperty>,
  varyingProperties: Record<string, GLTypeInfo>,
): { material: ShaderMaterial; varyingRowCount: number } {
  const uniforms: Record<string, { value: unknown }> = {};

  const uniformDeclarations: string[] = [];
  const attributeDeclarations: string[] = [];

  for (const name in uniformProperties) {
    const { value, glslTypeInfo } = uniformProperties[name];
    uniforms[`p_${name}`] = { value: value instanceof UIColor ? value.toGLSLColor() : value };
    uniformDeclarations.push(`uniform ${glslTypeInfo.glslTypeName} p_${name};`);
  }

  for (const name in varyingProperties) {
    attributeDeclarations.push(`attribute ${varyingProperties[name].glslTypeName} a_${name};`);
  }

  // Only what the fragment shader reads takes varyings. Most sources read a couple of builtin
  // values through the PARTICLE_* macros, so those are passed one by one rather than as the
  // whole builtin mat4; a source naming p_builtin itself gets the whole matrix.
  const unpackedFragment = buildParticleFragmentShader(uniformDeclarations, [], [], sources);
  const fields: VaryingFieldSpec[] = [];
  const macroFields: string[] = [];
  const wholeBuiltin = isIdentifierReferenced(unpackedFragment, `p_${BUILTIN_PROPERTY}`);

  if (isIdentifierReferenced(unpackedFragment, "p_uv")) {
    fields.push({ name: "p_uv", glslTypeName: "vec2", components: ["uv.x", "uv.y"] });
  }

  for (const name in varyingProperties) {
    const { glslTypeName, bufferSize, columnCount } = varyingProperties[name];

    if (name === BUILTIN_PROPERTY && !wholeBuiltin) {
      for (const [macro, index] of PARTICLE_BUILTIN_MACROS) {
        if (isIdentifierReferenced(unpackedFragment, macro)) {
          fields.push({
            name: macro,
            glslTypeName: "float",
            components: [builtinComponent(`a_${name}`, index)],
          });
          macroFields.push(macro);
        }
      }
      continue;
    }

    if (!isIdentifierReferenced(unpackedFragment, `p_${name}`)) {
      continue;
    }

    const columnSize = bufferSize / columnCount;
    const components: string[] = [];
    for (let i = 0; i < bufferSize; i++) {
      const column = columnCount > 1 ? `a_${name}[${Math.floor(i / columnSize)}]` : `a_${name}`;
      components.push(bufferSize > 1 ? `${column}.${"xyzw"[i % columnSize]}` : column);
    }
    fields.push({ name: `p_${name}`, glslTypeName, components });
  }

  const packed = packVaryings(fields);
  const fieldDeclarations = [...packed.declarations];
  const fieldAssignments: string[] = [];

  for (const { name, glslTypeName } of fields) {
    const expression = packed.fragmentExpressions.get(name) ?? "";
    if (macroFields.includes(name)) {
      fieldDeclarations.push(`#define ${name} ${expression}`);
    } else {
      fieldDeclarations.push(`${glslTypeName} ${name};`);
      fieldAssignments.push(`${name} = ${expression};`);
    }
  }
  if (wholeBuiltin) {
    fieldDeclarations.push(buildBuiltinMacros(`p_${BUILTIN_PROPERTY}`));
  }

  const material = new ShaderMaterial({
    uniforms,
    vertexShader: buildParticleVertexShader(
      uniformDeclarations,
      attributeDeclarations,
      packed.declarations,
      packed.vertexAssignments,
    ),
    fragmentShader: buildParticleFragmentShader(
      uniformDeclarations,
      fieldDeclarations,
      fieldAssignments,
      sources,
    ),
    transparent: true,
    side: DoubleSide,
    forceSinglePass: true,
    depthWrite: false,
    depthTest: true,
  });

  return { material, varyingRowCount: packed.rowCount };
}

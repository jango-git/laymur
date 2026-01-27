import { InstancedBufferGeometry, PlaneGeometry, ShaderMaterial } from "three";
import { UIColor } from "../../core";
import type { GLProperty, GLTypeInfo } from "../../core/miscellaneous/generic-plane/shared";
import { buildParticleFragmentShader } from "./shared";

export const INSTANCED_PARTICLE_PLANE_GEOMETRY = ((): InstancedBufferGeometry => {
  const planeGeometry = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = planeGeometry.index;
  geometry.setAttribute("position", planeGeometry.attributes["position"]);
  geometry.setAttribute("uv", planeGeometry.attributes["uv"]);
  planeGeometry.dispose();
  return geometry;
})();

export function buildMaterial(
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
    uniforms[`p_${name}`] = {
      value: value instanceof UIColor ? value.toGLSLColor() : value,
    };
    uniformDeclarations.push(`uniform ${glslTypeInfo.glslTypeName} p_${name};`);
  }

  for (const name in varyingProperties) {
    const { glslTypeName } = varyingProperties[name];
    attributeDeclarations.push(`attribute ${glslTypeName} a_${name};`);
    varyingDeclarations.push(`varying ${glslTypeName} p_${name};`);
    vertexAssignments.push(`p_${name} = a_${name};`);
  }

  const vertexShader = `
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
      transformedPosition *= a_scale;

      float cosR = cos(a_rotation);
      float sinR = sin(a_rotation);
      transformedPosition = vec2(
        transformedPosition.x * cosR - transformedPosition.y * sinR,
        transformedPosition.x * sinR + transformedPosition.y * cosR
      );

      transformedPosition += a_position;
      transformedPosition += p_origin;

      gl_Position = projectionMatrix * vec4(transformedPosition, position.z, 1.0);
    }
  `;

  const fragmentShader = buildParticleFragmentShader(
    uniformDeclarations,
    varyingDeclarations,
    sources,
  );

  return new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: true,
  });
}

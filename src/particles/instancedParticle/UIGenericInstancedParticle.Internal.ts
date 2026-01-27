import {
  InstancedBufferGeometry,
  Matrix3,
  Matrix4,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import { UIColor } from "../../core";
import type { GLProperty, GLTypeInfo, UIParticleProperty } from "./shared";
import { buildGenericPlaneFragmentShader } from "./shared";

export const INSTANCED_PLANE_GEOMETRY = ((): InstancedBufferGeometry => {
  const planeGeometry = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = planeGeometry.index;
  geometry.setAttribute("position", planeGeometry.attributes["position"]);
  geometry.setAttribute("uv", planeGeometry.attributes["uv"]);
  planeGeometry.dispose();
  return geometry;
})();

export const CAPACITY_STEP = 32;
const TEMP_COLOR_VECTOR = new Vector4();

export function writePropertyToArray(
  value: UIParticleProperty,
  array: Float32Array,
  offset: number,
): void {
  if (value instanceof UIColor) {
    value.toGLSLColor(TEMP_COLOR_VECTOR);
    array[offset] = TEMP_COLOR_VECTOR.x;
    array[offset + 1] = TEMP_COLOR_VECTOR.y;
    array[offset + 2] = TEMP_COLOR_VECTOR.z;
    array[offset + 3] = TEMP_COLOR_VECTOR.w;
  } else if (value instanceof Vector2) {
    array[offset] = value.x;
    array[offset + 1] = value.y;
  } else if (value instanceof Vector3) {
    array[offset] = value.x;
    array[offset + 1] = value.y;
    array[offset + 2] = value.z;
  } else if (value instanceof Vector4) {
    array[offset] = value.x;
    array[offset + 1] = value.y;
    array[offset + 2] = value.z;
    array[offset + 3] = value.w;
  } else if (value instanceof Matrix3 || value instanceof Matrix4) {
    const elements = value.elements;
    for (let j = 0; j < elements.length; j++) {
      array[offset + j] = elements[j];
    }
  } else if (typeof value === "number") {
    array[offset] = value;
  }
}

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

  const fragmentShader = buildGenericPlaneFragmentShader(
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

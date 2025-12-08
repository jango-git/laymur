import {
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix3,
  Matrix4,
  PlaneGeometry,
  ShaderMaterial,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import { UIColor } from "../UIColor";
import { UITransparencyMode } from "../UITransparencyMode";
import type { UIPropertyType } from "./shared";
import {
  buildGenericPlaneFragmentShader,
  DEFAULT_ALPHA_TEST,
  resolveGLSLTypeInfo,
} from "./shared";

export const INSTANCED_PLANE_GEOMETRY = ((): InstancedBufferGeometry => {
  const planeGeometry = new PlaneGeometry(1, 1);
  planeGeometry.translate(0.5, 0.5, 0);
  const geometry = new InstancedBufferGeometry();
  geometry.index = planeGeometry.index;
  geometry.setAttribute("position", planeGeometry.attributes["position"]);
  geometry.setAttribute("uv", planeGeometry.attributes["uv"]);
  planeGeometry.dispose();
  return geometry;
})();

export const CAPACITY_STEP = 4;

const TEMP_COLOR_VECTOR = new Vector4();
const IDENTITY_MATRIX_ELEMENTS = [
  1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
];

export function writePropertyToArray(
  value: UIPropertyType,
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

export function writeInstanceDefaults(
  visibilityArray: Float32Array,
  transformArray: Float32Array,
  index: number,
): void {
  visibilityArray[index] = 1;

  const transformOffset = index * 16;
  for (let j = 0; j < 16; j++) {
    transformArray[transformOffset + j] = IDENTITY_MATRIX_ELEMENTS[j];
  }
}

export function buildEmptyInstancedBufferAttribute(
  value: UIPropertyType,
  capacity: number,
): InstancedBufferAttribute {
  const info = resolveGLSLTypeInfo(value);
  if (!info.instantiable) {
    throw new Error(
      `Cannot create instanced attribute for non-instantiable type`,
    );
  }
  return new InstancedBufferAttribute(
    new Float32Array(capacity * info.itemSize),
    info.itemSize,
  );
}

export function buildMaterial(
  source: string,
  uniformProperties: Record<string, UIPropertyType>,
  varyingProperties: Record<string, UIPropertyType>,
  transparency: UITransparencyMode,
): ShaderMaterial {
  const uniforms: Record<string, { value: unknown }> = {};

  const uniformDeclarations: string[] = [];
  const attributeDeclarations: string[] = [];
  const varyingDeclarations: string[] = [];
  const vertexAssignments: string[] = [];

  for (const [name, value] of Object.entries(uniformProperties)) {
    const info = resolveGLSLTypeInfo(value);
    uniforms[`p_${name}`] = {
      value: value instanceof UIColor ? value.toGLSLColor() : value,
    };
    uniformDeclarations.push(`uniform ${info.glslType} p_${name};`);
  }

  for (const [name, value] of Object.entries(varyingProperties)) {
    const info = resolveGLSLTypeInfo(value);
    attributeDeclarations.push(`attribute ${info.glslType} a_${name};`);
    varyingDeclarations.push(`varying ${info.glslType} p_${name};`);
    vertexAssignments.push(`p_${name} = a_${name};`);
  }

  const vertexShader = `
    // User attributes
    ${attributeDeclarations.join("\n")}

    // Uniforms
    ${uniformDeclarations.join("\n")}

    // Builtin varyings
    varying vec3 p_position;
    varying vec2 p_uv;

    // User varyings
    ${varyingDeclarations.join("\n")}

    void main() {
      if (a_instanceVisibility < 0.5) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }

      ${vertexAssignments.join("\n")}

      p_position = position;
      p_uv = uv;

      gl_Position = projectionMatrix * a_instanceTransform * vec4(position, 1.0);
    }
  `;

  const fragmentShader = buildGenericPlaneFragmentShader(
    uniformDeclarations,
    varyingDeclarations,
    source,
  );

  return new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: transparency === UITransparencyMode.BLEND,
    alphaTest:
      transparency === UITransparencyMode.CLIP ? DEFAULT_ALPHA_TEST : 0.0,
    alphaHash: transparency === UITransparencyMode.HASH,
    depthWrite: transparency !== UITransparencyMode.BLEND,
    depthTest: true,
  });
}

export function reconstructValue(
  referenceValue: UIPropertyType,
  array: Float32Array,
  offset: number,
): UIPropertyType {
  if (typeof referenceValue === "number") {
    return array[offset];
  }
  if (referenceValue instanceof Vector2) {
    return new Vector2(array[offset], array[offset + 1]);
  }
  if (referenceValue instanceof Vector3) {
    return new Vector3(array[offset], array[offset + 1], array[offset + 2]);
  }
  if (referenceValue instanceof Vector4) {
    return new Vector4(
      array[offset],
      array[offset + 1],
      array[offset + 2],
      array[offset + 3],
    );
  }
  if (referenceValue instanceof UIColor) {
    return new UIColor().setGLSLColor(
      array[offset],
      array[offset + 1],
      array[offset + 2],
      array[offset + 3],
    );
  }
  if (referenceValue instanceof Matrix3) {
    const matrix = new Matrix3();
    matrix.fromArray(array, offset);
    return matrix;
  }
  if (referenceValue instanceof Matrix4) {
    const matrix = new Matrix4();
    matrix.fromArray(array, offset);
    return matrix;
  }
  throw new Error(`Cannot reconstruct value for type`);
}

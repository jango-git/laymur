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
import { DEFAULT_ALPHA_TEST, resolveTypeInfo } from "./shared";

export interface InstancedRangeDescriptor {
  firstIndex: number;
  count: number;
}

export const DEFAULT_VISIBILITY = 1;

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

export function writePropertyToArray(
  value: UIPropertyType,
  array: Float32Array,
  itemOffset: number,
): void {
  if (value instanceof UIColor) {
    value.toGLSLColor(TEMP_COLOR_VECTOR);
    array[itemOffset] = TEMP_COLOR_VECTOR.x;
    array[itemOffset + 1] = TEMP_COLOR_VECTOR.y;
    array[itemOffset + 2] = TEMP_COLOR_VECTOR.z;
    array[itemOffset + 3] = TEMP_COLOR_VECTOR.w;
  } else if (value instanceof Vector2) {
    array[itemOffset] = value.x;
    array[itemOffset + 1] = value.y;
  } else if (value instanceof Vector3) {
    array[itemOffset] = value.x;
    array[itemOffset + 1] = value.y;
    array[itemOffset + 2] = value.z;
  } else if (value instanceof Vector4) {
    array[itemOffset] = value.x;
    array[itemOffset + 1] = value.y;
    array[itemOffset + 2] = value.z;
    array[itemOffset + 3] = value.w;
  } else if (value instanceof Matrix3 || value instanceof Matrix4) {
    const elements = value.elements;
    for (let j = 0; j < elements.length; j++) {
      array[itemOffset + j] = elements[j];
    }
  } else if (typeof value === "number") {
    array[itemOffset] = value;
  }
}

export function buildEmptyInstancedBufferAttribute(
  value: UIPropertyType,
  capacity: number,
): InstancedBufferAttribute {
  const info = resolveTypeInfo(value);
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
    const info = resolveTypeInfo(value);
    uniforms[`p_${name}`] = {
      value: value instanceof UIColor ? value.toGLSLColor() : value,
    };
    uniformDeclarations.push(`uniform ${info.glslType} p_${name};`);
  }

  for (const [name, value] of Object.entries(varyingProperties)) {
    const info = resolveTypeInfo(value);
    attributeDeclarations.push(`attribute ${info.glslType} a_${name};`);
    varyingDeclarations.push(`varying ${info.glslType} p_${name};`);
    vertexAssignments.push(`p_${name} = a_${name};`);
  }

  const vertexShader = `
    // Default attribute declarations
    attribute float a_instanceVisibility;
    attribute mat4 a_instanceTransform;

    // Custom attribute declarations
    ${attributeDeclarations.join("\n")}

    // Uniform declarations
    ${uniformDeclarations.join("\n")}

    // Default varying declarations
    varying vec3 p_position;
    varying vec2 p_uv;

    // Custom varying declarations
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

  const fragmentShader = `
    // Uniform declarations
    ${uniformDeclarations.join("\n")}

    // Default varying declarations
    varying vec3 p_position;
    varying vec2 p_uv;

    // Custom varying declarations
    ${varyingDeclarations.join("\n")}

    #include <alphahash_pars_fragment>

    // Source must define 'draw' function
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

  const material = new ShaderMaterial({
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

  return material;
}

export function validateRange(
  descriptor: InstancedRangeDescriptor,
  offset: number,
  count: number,
): void {
  if (offset + count > descriptor.count) {
    throw new Error(
      `Range [${offset}, ${offset + count}) exceeds descriptor range [0, ${descriptor.count})`,
    );
  }
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
    return new UIColor(
      array[offset],
      array[offset + 1],
      array[offset + 2],
      array[offset + 3],
    );
  }
  if (referenceValue instanceof Matrix3) {
    const m3 = new Matrix3();
    m3.fromArray(array, offset);
    return m3;
  }
  if (referenceValue instanceof Matrix4) {
    const m4 = new Matrix4();
    m4.fromArray(array, offset);
    return m4;
  }
  throw new Error(`Cannot reconstruct value for type`);
}

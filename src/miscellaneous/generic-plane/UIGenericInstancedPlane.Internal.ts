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
import type { UIPropertyType, UIPropertyTypeName } from "./shared";
import { DEFAULT_ALPHA_TEST, resolveTypeInfo } from "./shared";

export interface InstancedRangeDescriptor {
  firstIndex: number;
  count: number;
}

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
export const TEMP_VECTOR_4 = new Vector4();

export function writePropertyToArray(
  value: UIPropertyType,
  array: Float32Array,
  itemOffset: number,
): void {
  if (value instanceof UIColor) {
    value.toGLSLColor(TEMP_VECTOR_4);
    array[itemOffset] = TEMP_VECTOR_4.x;
    array[itemOffset + 1] = TEMP_VECTOR_4.y;
    array[itemOffset + 2] = TEMP_VECTOR_4.z;
    array[itemOffset + 3] = TEMP_VECTOR_4.w;
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
  typeName: UIPropertyTypeName,
  capacity: number,
): InstancedBufferAttribute {
  const info = resolveTypeInfo(typeName);
  if (!info.instantiable) {
    throw new Error(
      `Cannot create instanced attribute for non-instantiable type: ${typeName}`,
    );
  }
  return new InstancedBufferAttribute(
    new Float32Array(capacity * info.itemSize),
    info.itemSize,
  );
}

export function buildMaterial(
  source: string,
  uniformLayout: Record<string, UIPropertyTypeName>,
  varyingLayout: Record<string, UIPropertyTypeName>,
  transparency: UITransparencyMode,
): ShaderMaterial {
  const uniforms: Record<string, { value: null }> = {};

  const uniformDeclarations: string[] = [];
  const attributeDeclarations: string[] = [];
  const varyingDeclarations: string[] = [];
  const vertexAssignments: string[] = [];

  for (const [name, propertyTypeName] of Object.entries(uniformLayout)) {
    const info = resolveTypeInfo(propertyTypeName);
    uniforms[`u_${name}`] = { value: null };
    uniformDeclarations.push(`uniform ${info.glslType} u_${name};`);
  }

  for (const [name, propertyTypeName] of Object.entries(varyingLayout)) {
    const info = resolveTypeInfo(propertyTypeName);
    attributeDeclarations.push(`attribute ${info.glslType} a_${name};`);
    varyingDeclarations.push(`varying ${info.glslType} v_${name};`);
    vertexAssignments.push(`v_${name} = a_${name};`);
  }

  const vertexShader = `
    // Default attribute declaractions
    attribute float a_instanceVisibility;
    attribute mat4 a_instanceTransform;

    // Custom attribute declaractions
    ${attributeDeclarations.join("\n")}

    // Uniform declaractions
    ${uniformDeclarations.join("\n")}

    // Default varying declaractions
    varying vec3 v_position;
    varying vec2 v_uv;

    // Custom varying declaractions
    ${varyingDeclarations.join("\n")}

    void main() {
      if (a_instanceVisibility < 0.5) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }

      ${vertexAssignments.join("\n")}

      v_position = position;
      v_uv = uv;

      gl_Position = projectionMatrix * a_instanceTransform * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    // Uniform declaractions
    ${uniformDeclarations.join("\n")}

    // Default varying declaractions
    varying vec3 v_position;
    varying vec2 v_uv;

    // Custom varying declaractions
    ${varyingDeclarations.join("\n")}

    #include <alphahash_pars_fragment>

    // Source have to define 'draw' function
    ${source}

    void main() {
      vec4 diffuseColor = draw();

      #ifdef USE_ALPHATEST
        if (diffuseColor.a < ${DEFAULT_ALPHA_TEST.toFixed(2)}) {
          discard;
        }
      #endif

      #ifdef USE_ALPHAHASH
        if (diffuseColor.a < getAlphaHashThreshold(v_position)) {
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

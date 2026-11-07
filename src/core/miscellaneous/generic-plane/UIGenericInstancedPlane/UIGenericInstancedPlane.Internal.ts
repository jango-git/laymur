import {
  DoubleSide,
  Float32BufferAttribute,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix3,
  Matrix4,
  ShaderMaterial,
  Uint16BufferAttribute,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import maskSource from "../../../shaders/UIMask.js";
import { UIColor } from "../../color/UIColor.js";
import { UITransparencyMode } from "../../UITransparencyMode.js";
import type { GLProperty, UIProperty } from "../shared.js";
import { buildGenericPlaneFragmentShader, resolveGLSLTypeInfo } from "../shared.js";
import type { VaryingFieldSpec } from "../varyingPacking.js";
import { isIdentifierReferenced, packVaryings } from "../varyingPacking.js";
import type { PackedFieldSpec, PackedLayout } from "./UIGenericInstancedPlane.Layout.js";
import {
  buildPackedAttributeDeclarations,
  buildPackedFieldComponents,
  buildPackedFieldSpec,
  buildPackedLayout,
  resolvePackedField,
} from "./UIGenericInstancedPlane.Layout.js";

export const INSTANCED_PLANE_GEOMETRY = ((): InstancedBufferGeometry => {
  const geometry = new InstancedBufferGeometry();

  const indices = new Uint16Array([0, 2, 1, 2, 3, 1]);
  geometry.setIndex(new Uint16BufferAttribute(indices, 1));

  const positions = new Float32Array([0, 1, 0, 1, 1, 0, 0, 0, 0, 1, 0, 0]);
  geometry.setAttribute("position", new Float32BufferAttribute(positions, 3));

  const uvs = new Float32Array([0, 1, 1, 1, 0, 0, 1, 0]);
  geometry.setAttribute("uv", new Float32BufferAttribute(uvs, 2));

  return geometry;
})();

export const CAPACITY_STEP = 4;
export const INITIAL_CAPACITY = 1;

const TEMP_COLOR_VECTOR = new Vector4();

/**
 * Flattens a property value into the array.
 * @param affine Write a Matrix3 as a 2D affine transform: its three columns without the bottom row
 */
export function writePropertyToArray(
  value: UIProperty,
  array: Float32Array,
  offset: number,
  affine = false,
): void {
  if (affine && value instanceof Matrix3) {
    const elements = value.elements;
    array[offset] = elements[0];
    array[offset + 1] = elements[1];
    array[offset + 2] = elements[3];
    array[offset + 3] = elements[4];
    array[offset + 4] = elements[6];
    array[offset + 5] = elements[7];
  } else if (value instanceof UIColor) {
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

export const BUILTIN_TRANSFORM = "instanceTransform";
export const BUILTIN_VISIBILITY = "instanceVisibility";
export const BUILTIN_BLEND = "instanceBlend";
export const BUILTIN_HSL = "instanceHSL";

/** Rows of the layer -> mask-local map, see MASK_DATA_SIZE; present on masked planes only */
export const BUILTIN_MASK_ROW0 = "instanceMaskRow0";
export const BUILTIN_MASK_ROW1 = "instanceMaskRow1";
/** Half width, half height, corner radius and softness of the mask */
export const BUILTIN_MASK_SHAPE = "instanceMaskShape";
/** Mask shape + 2 when inverted */
export const BUILTIN_MASK_MODE = "instanceMaskMode";

/**
 * Builtin fields only the vertex shader reads. Every other field, builtin blend and HSL included,
 * is passed on to the fragment shader as a p_* varying.
 */
const BUILTIN_VERTEX_ONLY: readonly string[] = [
  BUILTIN_TRANSFORM,
  BUILTIN_VISIBILITY,
  BUILTIN_MASK_ROW0,
  BUILTIN_MASK_ROW1,
];

/**
 * The transform is a Matrix4, but the plane is a unit quad at z = 0 and every element transform
 * is affine: the z basis column only ever multiplies 0 and the bottom row is always (0, 0, 0, 1).
 * Only the x basis, y basis and translation columns are stored, without their w components, and
 * the shader applies them as mat3(xBasis, yBasis, translation) * vec3(position.xy, 1.0).
 * Translation z is the zIndex, see TRANSFORM_ZINDEX_OFFSET.
 */
const BUILTIN_TRANSFORM_SPEC: PackedFieldSpec = {
  name: BUILTIN_TRANSFORM,
  glslTypeName: "mat3",
  flatSize: 16,
  columns: [
    { sourceOffset: 0, size: 3 },
    { sourceOffset: 4, size: 3 },
    { sourceOffset: 12, size: 3 },
  ],
};

export function buildPlaneLayout(
  varyingProperties: Record<string, GLProperty>,
  masked: boolean,
): PackedLayout {
  const specs: PackedFieldSpec[] = [
    BUILTIN_TRANSFORM_SPEC,
    buildPackedFieldSpec(BUILTIN_VISIBILITY, resolveGLSLTypeInfo("number")),
    buildPackedFieldSpec(BUILTIN_BLEND, resolveGLSLTypeInfo("number")),
    buildPackedFieldSpec(BUILTIN_HSL, resolveGLSLTypeInfo("Vector3")),
  ];

  if (masked) {
    specs.push(
      buildPackedFieldSpec(BUILTIN_MASK_ROW0, resolveGLSLTypeInfo("Vector3")),
      buildPackedFieldSpec(BUILTIN_MASK_ROW1, resolveGLSLTypeInfo("Vector3")),
      buildPackedFieldSpec(BUILTIN_MASK_SHAPE, resolveGLSLTypeInfo("Vector4")),
      buildPackedFieldSpec(BUILTIN_MASK_MODE, resolveGLSLTypeInfo("number")),
    );
  }

  for (const name in varyingProperties) {
    specs.push(buildPackedFieldSpec(name, varyingProperties[name].glslTypeInfo));
  }

  return buildPackedLayout(specs);
}

export function buildPackedAttribute(itemSize: number, capacity: number): InstancedBufferAttribute {
  return new InstancedBufferAttribute(new Float32Array(capacity * itemSize), itemSize);
}

export function buildMaterial(
  source: string,
  uniformProperties: Record<string, GLProperty>,
  layout: PackedLayout,
  transparency: UITransparencyMode,
  masked: boolean,
): { material: ShaderMaterial; varyingRowCount: number } {
  const uniforms: Record<string, { value: unknown }> = {};
  const uniformDeclarations: string[] = [];

  for (const name in uniformProperties) {
    const { value, glslTypeInfo } = uniformProperties[name];
    uniforms[`p_${name}`] = {
      value: value instanceof UIColor ? value.toGLSLColor() : value,
    };
    uniformDeclarations.push(`uniform ${glslTypeInfo.glslTypeName} p_${name};`);
  }

  // Every value the fragment shader may read, as p_* fields
  const candidates: VaryingFieldSpec[] = [
    { name: "p_uv", glslTypeName: "vec2", components: ["uv.x", "uv.y"] },
  ];
  for (const [name, field] of layout.fields) {
    if (!BUILTIN_VERTEX_ONLY.includes(name)) {
      candidates.push({
        name: `p_${name}`,
        glslTypeName: field.glslTypeName,
        components: buildPackedFieldComponents(layout, field),
        affine: field.affine,
      });
    }
  }

  const visibility = resolvePackedField(layout, BUILTIN_VISIBILITY).expression;
  const transform = resolvePackedField(layout, BUILTIN_TRANSFORM).expression;

  let maskVertex = "";
  if (masked) {
    const row0 = resolvePackedField(layout, BUILTIN_MASK_ROW0).expression;
    const row1 = resolvePackedField(layout, BUILTIN_MASK_ROW1).expression;
    candidates.push({
      name: "p_instanceMaskLocal",
      glslTypeName: "vec2",
      components: ["maskLocal.x", "maskLocal.y"],
    });
    // worldPosition.z carries the zIndex, the mask map only takes the plane position
    maskVertex = `
      vec3 maskPoint = vec3(worldPosition.xy, 1.0);
      vec2 maskLocal = vec2(dot(${row0}, maskPoint), dot(${row1}, maskPoint));
    `;
  }

  const alphaTestValue = 0.0075;
  const premultipliedAlpha = transparency === UITransparencyMode.BLEND;
  const maskFragment = masked ? maskSource : undefined;

  // Only fields the fragment shader reads take varyings: the blend factor, for one, is read by
  // premultiplied shaders only. The shader without fields tells which ones it reads.
  const unpackedFragment = buildGenericPlaneFragmentShader(
    uniformDeclarations,
    [],
    [],
    source,
    alphaTestValue,
    premultipliedAlpha,
    maskFragment,
  );
  const fields = candidates.filter(({ name }) => isIdentifierReferenced(unpackedFragment, name));
  const packed = packVaryings(fields);

  const fieldDeclarations = [...packed.declarations];
  const fieldAssignments: string[] = [];
  for (const { name, glslTypeName } of fields) {
    fieldDeclarations.push(`${glslTypeName} ${name};`);
    fieldAssignments.push(`${name} = ${packed.fragmentExpressions.get(name) ?? ""};`);
  }

  const vertexShader = `
    ${buildPackedAttributeDeclarations(layout).join("\n")}

    // Uniforms
    ${uniformDeclarations.join("\n")}

    // Packed varyings
    ${packed.declarations.join("\n")}

    void main() {
      if (${visibility} < 0.5) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }

      vec3 worldPosition = ${transform} * vec3(position.xy, 1.0);
      gl_Position = projectionMatrix * vec4(worldPosition, 1.0);
      ${maskVertex}

      ${packed.vertexAssignments.join("\n")}
    }
  `;

  const fragmentShader = buildGenericPlaneFragmentShader(
    uniformDeclarations,
    fieldDeclarations,
    fieldAssignments,
    source,
    alphaTestValue,
    premultipliedAlpha,
    maskFragment,
  );

  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: transparency === UITransparencyMode.BLEND,
    alphaTest: alphaTestValue,
    alphaHash: transparency === UITransparencyMode.HASH,
    depthWrite: false,
    depthTest: false,
    side: DoubleSide,
    forceSinglePass: true,
    premultipliedAlpha,
  });

  if (masked) {
    // fwidth on WebGL1 (three.js before r163); WebGL2 has derivatives built in
    material.extensions.derivatives = true;
  }

  return { material, varyingRowCount: packed.rowCount };
}

/**
 * Shift buffer region within the same array.
 * Uses copyWithin for efficient memory moves with correct overlap handling.
 */
export function shiftBufferRegion(
  array: Float32Array,
  itemSize: number,
  fromIndex: number,
  count: number,
  delta: number,
): void {
  if (count <= 0 || delta === 0) {
    return;
  }

  const srcOffset = fromIndex * itemSize;
  const dstOffset = (fromIndex + delta) * itemSize;
  const length = count * itemSize;

  array.copyWithin(dstOffset, srcOffset, srcOffset + length);
}

/**
 * Copy data between two different buffers.
 */
export function copyBetweenBuffers(
  src: Float32Array,
  srcOffset: number,
  dst: Float32Array,
  dstOffset: number,
  length: number,
): void {
  for (let i = 0; i < length; i++) {
    dst[dstOffset + i] = src[srcOffset + i];
  }
}

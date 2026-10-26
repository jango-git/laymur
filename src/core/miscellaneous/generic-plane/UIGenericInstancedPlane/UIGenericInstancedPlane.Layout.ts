import type { GLTypeInfo } from "../shared.js";

/**
 * Packing of per-instance fields into vertex attributes.
 *
 * A vertex attribute location holds at most a vec4, and an attribute of any smaller type still
 * takes a whole location, while devices commonly offer only 16 locations. Declaring one attribute
 * per field therefore spends most of that budget on padding. Instead every field is cut into
 * columns of 1..4 floats (a matrix into its columns, anything else into a single column), and the
 * columns are bin-packed into as few attributes as possible. The vertex shader reassembles each
 * field from swizzles of the packed attributes.
 *
 * The layout is a pure function of the set of fields, independent of their declaration order, so
 * planes built from the same fields always share a layout and their buffers can be merged or split
 * by plain copies.
 */

const PACKED_ATTRIBUTE_CAPACITY = 4;

const PACKED_ATTRIBUTE_TYPES: readonly string[] = ["float", "vec2", "vec3", "vec4"];
const SWIZZLE_COMPONENTS = "xyzw";

export interface PackedColumnSpec {
  sourceOffset: number;
  size: number;
}

/**
 * A field to be packed. Its value is flattened into flatSize floats, and each column takes size
 * (1..4) of them starting at sourceOffset. Columns are listed in the order the GLSL constructor of
 * glslTypeName takes them, which is how the vertex shader reassembles the field.
 */
export interface PackedFieldSpec {
  name: string;
  glslTypeName: string;
  flatSize: number;
  columns: readonly PackedColumnSpec[];
}

/**
 * A column placed into the packed attribute attributeIndex, starting at its component
 * componentOffset.
 */
export interface PackedColumn extends PackedColumnSpec {
  attributeIndex: number;
  componentOffset: number;
}

/**
 * A field placed into packed attributes. Expression is the GLSL that reads it back from them in
 * the vertex shader.
 */
export interface PackedField {
  glslTypeName: string;
  columns: readonly PackedColumn[];
  expression: string;
}

/**
 * attributeSizes holds the item size (1..4) of each packed attribute. Two layouts with an equal
 * signature place every field identically, so buffers can be copied between their planes as is.
 */
export interface PackedLayout {
  attributeSizes: readonly number[];
  fields: ReadonlyMap<string, PackedField>;
  signature: string;
}

export function packedAttributeName(attributeIndex: number): string {
  return `a_packed${attributeIndex}`;
}

export function buildPackedFieldSpec(name: string, glslTypeInfo: GLTypeInfo): PackedFieldSpec {
  const { glslTypeName, bufferSize, columnCount, instantiable } = glslTypeInfo;
  if (!instantiable) {
    throw new Error(
      `buildPackedFieldSpec.glslTypeInfo: "${name}" (${glslTypeName}) is not instantiable`,
    );
  }

  const columnSize = bufferSize / columnCount;
  const columns: PackedColumnSpec[] = [];
  for (let i = 0; i < columnCount; i++) {
    columns.push({ sourceOffset: i * columnSize, size: columnSize });
  }

  return { name, glslTypeName, flatSize: bufferSize, columns };
}

function compareNames(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * Places the columns of the given fields into packed attributes, first fit by decreasing size;
 * with sizes of 1..4 and bins of 4 that takes the minimal number of attributes. Ties are broken by
 * field name and column index, so the result does not depend on the order the fields come in.
 */
export function buildPackedLayout(specs: readonly PackedFieldSpec[]): PackedLayout {
  const entries: { spec: PackedFieldSpec; columnIndex: number }[] = [];
  const names = new Set<string>();

  for (const spec of specs) {
    if (names.has(spec.name)) {
      throw new Error(`buildPackedLayout.specs: duplicate field "${spec.name}"`);
    }
    names.add(spec.name);

    for (let i = 0; i < spec.columns.length; i++) {
      const { sourceOffset, size } = spec.columns[i];
      if (size < 1 || size > PACKED_ATTRIBUTE_CAPACITY || sourceOffset + size > spec.flatSize) {
        throw new Error(`buildPackedLayout.specs: invalid column ${i} of field "${spec.name}"`);
      }
      entries.push({ spec, columnIndex: i });
    }
  }

  entries.sort(
    (a, b) =>
      b.spec.columns[b.columnIndex].size - a.spec.columns[a.columnIndex].size ||
      compareNames(a.spec.name, b.spec.name) ||
      a.columnIndex - b.columnIndex,
  );

  const attributeSizes: number[] = [];
  const placements = new Map<PackedFieldSpec, PackedColumn[]>();

  for (const { spec, columnIndex } of entries) {
    const column = spec.columns[columnIndex];

    let attributeIndex = attributeSizes.findIndex(
      (used) => used + column.size <= PACKED_ATTRIBUTE_CAPACITY,
    );
    if (attributeIndex === -1) {
      attributeIndex = attributeSizes.length;
      attributeSizes.push(0);
    }

    let placed = placements.get(spec);
    if (placed === undefined) {
      placed = new Array<PackedColumn>(spec.columns.length);
      placements.set(spec, placed);
    }
    placed[columnIndex] = {
      sourceOffset: column.sourceOffset,
      size: column.size,
      attributeIndex,
      componentOffset: attributeSizes[attributeIndex],
    };

    attributeSizes[attributeIndex] += column.size;
  }

  const fields = new Map<string, PackedField>();
  const signatureParts: string[] = [];

  for (const spec of [...specs].sort((a, b) => compareNames(a.name, b.name))) {
    const columns = placements.get(spec) ?? [];

    const columnExpressions = columns.map(({ attributeIndex, componentOffset, size }) => {
      const attributeName = packedAttributeName(attributeIndex);
      return size === attributeSizes[attributeIndex]
        ? attributeName
        : `${attributeName}.${SWIZZLE_COMPONENTS.slice(componentOffset, componentOffset + size)}`;
    });

    const expression =
      columnExpressions.length === 1
        ? columnExpressions[0]
        : `${spec.glslTypeName}(${columnExpressions.join(", ")})`;

    fields.set(spec.name, { glslTypeName: spec.glslTypeName, columns, expression });

    const sourceOffsets = columns.map(({ sourceOffset }) => sourceOffset).join(",");
    signatureParts.push(`${spec.name}:${spec.glslTypeName}[${sourceOffsets}]=${expression}`);
  }

  return { attributeSizes, fields, signature: signatureParts.join(";") };
}

export function resolvePackedField(layout: PackedLayout, name: string): PackedField {
  const field = layout.fields.get(name);
  if (field === undefined) {
    throw new Error(`resolvePackedField.name: unknown field "${name}"`);
  }
  return field;
}

export function buildPackedAttributeDeclarations(layout: PackedLayout): string[] {
  return layout.attributeSizes.map(
    (size, index) => `attribute ${PACKED_ATTRIBUTE_TYPES[size - 1]} ${packedAttributeName(index)};`,
  );
}

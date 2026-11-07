/**
 * Packing of varyings into as few vec4 rows as possible.
 *
 * The varying budget (MAX_VARYING_VECTORS: at least 8 on WebGL1, 15 on WebGL2) is counted in
 * rows of four components, and drivers lay varyings out with the GLSL ES reference algorithm:
 * a vec3 or a mat3 column leaves its fourth component to floats only, so vec3 + vec2 already
 * takes two rows. Instead every field is cut into scalars and placed into packed vec4 varyings
 * by the shader generator itself, which takes exactly ceil(components / 4) rows. Fields are
 * kept contiguous where they fit, so most reads stay plain swizzles.
 *
 * Packing changes nothing for interpolation: varyings are interpolated per component. The
 * fragment shader reassembles each field once, which costs a few register moves.
 *
 * The row count is exact, so the budget can be checked before the program fails to link.
 */

const ROW_CAPACITY = 4;
const ROW_TYPES: readonly string[] = ["float", "vec2", "vec3", "vec4"];
const SWIZZLE_COMPONENTS = "xyzw";

/** Number of components and column size of the GLSL types a varying field may have */
const TYPE_SHAPES: Readonly<Record<string, { size: number; columnSize: number }>> = {
  float: { size: 1, columnSize: 1 },
  vec2: { size: 2, columnSize: 2 },
  vec3: { size: 3, columnSize: 3 },
  vec4: { size: 4, columnSize: 4 },
  mat2: { size: 4, columnSize: 2 },
  mat3: { size: 9, columnSize: 3 },
  mat4: { size: 16, columnSize: 4 },
};

const AFFINE_SHAPE = { size: 6, columnSize: 2 };

/** A value passed from the vertex to the fragment shader */
export interface VaryingFieldSpec {
  /** Name the fragment shader knows the field by; only used to key the result */
  name: string;
  glslTypeName: string;
  /**
   * Vertex shader expressions of the scalar components, in the order the GLSL constructor of
   * glslTypeName takes them (column-major for matrices)
   */
  components: readonly string[];
  /** A mat3 given as three columns of two, the bottom row taken as (0, 0, 1) */
  affine?: boolean;
}

export interface PackedVaryings {
  /** Number of varying rows (vec4 locations) taken */
  rowCount: number;
  /** Varying declarations, the same for both shaders */
  declarations: string[];
  /** Vertex shader statements writing the packed varyings */
  vertexAssignments: string[];
  /** Fragment shader expression reassembling each field, by field name */
  fragmentExpressions: Map<string, string>;
}

interface Slot {
  row: number;
  component: number;
}

export function packedVaryingName(row: number): string {
  return `v_packed${row}`;
}

/** Whether the code mentions the identifier as a whole word */
export function isIdentifierReferenced(code: string, identifier: string): boolean {
  return new RegExp(`\\b${identifier}\\b`).test(code);
}

/**
 * Splits `base.xyz`-style scalar expressions into runs that can be read with one swizzle.
 * Expressions that are not a swizzle of a single component stay on their own.
 */
function groupSwizzles(
  expressions: readonly string[],
  fullSizes: ReadonlyMap<string, number>,
): string[] {
  const groups: string[] = [];
  let base: string | undefined;
  let letters = "";

  const flush = (): void => {
    if (base !== undefined) {
      const isWhole =
        fullSizes.get(base) === letters.length && SWIZZLE_COMPONENTS.startsWith(letters);
      groups.push(isWhole ? base : `${base}.${letters}`);
    }
    base = undefined;
    letters = "";
  };

  for (const expression of expressions) {
    const match = /^([A-Za-z_]\w*(?:\[\d+\])*)\.([xyzw])$/.exec(expression);
    if (match === null) {
      flush();
      groups.push(expression);
      continue;
    }

    const [, expressionBase, letter] = match;
    const expected =
      base === undefined
        ? undefined
        : SWIZZLE_COMPONENTS[SWIZZLE_COMPONENTS.indexOf(letters[letters.length - 1]) + 1];
    if (expressionBase === base && letter === expected) {
      letters += letter;
    } else {
      flush();
      base = expressionBase;
      letters = letter;
    }
  }
  flush();

  return groups;
}

function buildConstructor(glslTypeName: string, groups: readonly string[], size: number): string {
  // A single group of the right size already has the right type, unless a matrix is built
  if (groups.length === 1 && !glslTypeName.startsWith("mat")) {
    return groups[0];
  }
  return size === 1 ? groups[0] : `${glslTypeName}(${groups.join(", ")})`;
}

/**
 * Packs the fields into vec4 varyings. The layout depends on the fields and their order only.
 * @throws If a field has an unsupported type or a wrong number of components
 */
export function packVaryings(fields: readonly VaryingFieldSpec[]): PackedVaryings {
  interface Chunk {
    fieldIndex: number;
    offset: number;
    size: number;
  }

  const chunks: Chunk[] = [];
  let total = 0;

  fields.forEach((field, fieldIndex) => {
    const shape =
      field.affine === true && field.glslTypeName === "mat3"
        ? AFFINE_SHAPE
        : (TYPE_SHAPES[field.glslTypeName] as (typeof TYPE_SHAPES)[string] | undefined);
    if (shape === undefined) {
      throw new Error(
        `packVaryings.fields: unsupported type ${field.glslTypeName} of "${field.name}"`,
      );
    }
    if (field.components.length !== shape.size) {
      throw new Error(
        `packVaryings.fields: "${field.name}" needs ${shape.size} components, got ${field.components.length}`,
      );
    }
    for (let offset = 0; offset < shape.size; offset += shape.columnSize) {
      chunks.push({ fieldIndex, offset, size: shape.columnSize });
    }
    total += shape.size;
  });

  // Largest chunks first, ties in declaration order, so the layout is deterministic
  const order = chunks
    .map((chunk, index) => ({ chunk, index }))
    .sort((a, b) => b.chunk.size - a.chunk.size || a.index - b.index);

  const rowCount = Math.ceil(total / ROW_CAPACITY);
  const used = new Array<number>(rowCount).fill(0);
  const slots = fields.map((field) => new Array<Slot>(field.components.length));

  for (const { chunk } of order) {
    const fieldSlots = slots[chunk.fieldIndex];

    // Best fit keeps a chunk whole and leaves the larger gaps for the larger chunks
    let bestRow = -1;
    for (let row = 0; row < rowCount; row++) {
      const free = ROW_CAPACITY - used[row];
      if (free >= chunk.size && (bestRow === -1 || free < ROW_CAPACITY - used[bestRow])) {
        bestRow = row;
      }
    }

    if (bestRow !== -1) {
      for (let i = 0; i < chunk.size; i++) {
        fieldSlots[chunk.offset + i] = { row: bestRow, component: used[bestRow] + i };
      }
      used[bestRow] += chunk.size;
      continue;
    }

    // No room for the whole chunk: spread it over the remaining components; rowCount rows
    // always have room for all of them
    let i = 0;
    for (let row = 0; row < rowCount && i < chunk.size; row++) {
      while (used[row] < ROW_CAPACITY && i < chunk.size) {
        fieldSlots[chunk.offset + i] = { row, component: used[row] };
        used[row]++;
        i++;
      }
    }
  }

  const rowSources: string[][] = used.map((size) => new Array<string>(size));
  fields.forEach((field, fieldIndex) => {
    slots[fieldIndex].forEach(({ row, component }, componentIndex) => {
      rowSources[row][component] = field.components[componentIndex];
    });
  });

  const declarations: string[] = [];
  const vertexAssignments: string[] = [];
  const rowSizes = new Map<string, number>();

  for (let row = 0; row < rowCount; row++) {
    const name = packedVaryingName(row);
    const size = used[row];
    const type = ROW_TYPES[size - 1];
    rowSizes.set(name, size);
    declarations.push(`varying ${type} ${name};`);
    vertexAssignments.push(
      `${name} = ${buildConstructor(type, groupSwizzles(rowSources[row], new Map()), size)};`,
    );
  }

  const fragmentExpressions = new Map<string, string>();
  fields.forEach((field, fieldIndex) => {
    const references = slots[fieldIndex].map(({ row, component }) =>
      rowSizes.get(packedVaryingName(row)) === 1
        ? packedVaryingName(row)
        : `${packedVaryingName(row)}.${SWIZZLE_COMPONENTS[component]}`,
    );
    if (field.affine === true) {
      const columns = [0, 2, 4].map((start) =>
        groupSwizzles(references.slice(start, start + 2), rowSizes).join(", "),
      );
      fragmentExpressions.set(
        field.name,
        `mat3(vec3(${columns[0]}, 0.0), vec3(${columns[1]}, 0.0), vec3(${columns[2]}, 1.0))`,
      );
      return;
    }
    fragmentExpressions.set(
      field.name,
      buildConstructor(
        field.glslTypeName,
        groupSwizzles(references, rowSizes),
        field.components.length,
      ),
    );
  });

  return { rowCount, declarations, vertexAssignments, fragmentExpressions };
}

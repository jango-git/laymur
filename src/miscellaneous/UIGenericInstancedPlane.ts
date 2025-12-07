import type { IUniform } from "three";
import {
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix3,
  Matrix4,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
  Texture,
  Vector2,
  Vector3,
  Vector4,
} from "three";
import { UIColor } from "../miscellaneous/UIColor";
import { UITransparencyMode } from "./UITransparencyMode";
import { assertValidNonNegativeNumber } from "./asserts";

export type UIPropertyType =
  | Texture
  | UIColor
  | Vector2
  | Vector3
  | Vector4
  | Matrix3
  | Matrix4
  | number;

export type UIPropertyTypeName =
  | "Texture"
  | "UIColor"
  | "Vector2"
  | "Vector3"
  | "Vector4"
  | "Matrix3"
  | "Matrix4"
  | "number";

interface Descriptor {
  firstIndex: number;
  count: number;
}

interface TypeInfo {
  instantiable: boolean;
  glslType: string;
  itemSize: number;
}

const INSTANCED_GEOMETRY = ((): InstancedBufferGeometry => {
  const planeGeometry = new PlaneGeometry(1, 1);
  planeGeometry.translate(0.5, 0.5, 0);
  const geometry = new InstancedBufferGeometry();
  geometry.index = planeGeometry.index;
  geometry.setAttribute("position", planeGeometry.attributes["position"]);
  geometry.setAttribute("uv", planeGeometry.attributes["uv"]);
  planeGeometry.dispose();
  return geometry;
})();

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Constructor type needs to accept any arguments for generic type mapping
const TYPE_INFO_MAP = new Map<string | (new (...args: any[]) => any), TypeInfo>(
  [
    ["Texture", { glslType: "sampler2D", instantiable: false, itemSize: -1 }],
    [Texture, { glslType: "sampler2D", instantiable: false, itemSize: -1 }],
    ["UIColor", { glslType: "vec4", instantiable: true, itemSize: 4 }],
    [UIColor, { glslType: "vec4", instantiable: true, itemSize: 4 }],
    ["Vector2", { glslType: "vec2", instantiable: true, itemSize: 2 }],
    [Vector2, { glslType: "vec2", instantiable: true, itemSize: 2 }],
    ["Vector3", { glslType: "vec3", instantiable: true, itemSize: 3 }],
    [Vector3, { glslType: "vec3", instantiable: true, itemSize: 3 }],
    ["Vector4", { glslType: "vec4", instantiable: true, itemSize: 4 }],
    [Vector4, { glslType: "vec4", instantiable: true, itemSize: 4 }],
    ["Matrix3", { glslType: "mat3", instantiable: true, itemSize: 9 }],
    [Matrix3, { glslType: "mat3", instantiable: true, itemSize: 9 }],
    ["Matrix4", { glslType: "mat4", instantiable: true, itemSize: 16 }],
    [Matrix4, { glslType: "mat4", instantiable: true, itemSize: 16 }],
    ["number", { glslType: "float", instantiable: true, itemSize: 1 }],
  ],
);

const CAPACITY_STEP = 4;
const DEFAULT_ALPHA_TEST = 0.5;
const DEFAULT_VISIBILITY = 1;

function resolveTypeInfo(
  property: UIPropertyType | UIPropertyTypeName,
): TypeInfo {
  if (typeof property === "string") {
    const info = TYPE_INFO_MAP.get(property);
    if (info) {
      return info;
    }
  } else if (typeof property === "number") {
    const info = TYPE_INFO_MAP.get("number");
    if (info) {
      return info;
    }
  } else {
    for (const [key, info] of TYPE_INFO_MAP) {
      if (typeof key === "function" && property instanceof key) {
        return info;
      }
    }
  }
  throw new Error(`Unsupported property type: ${property}`);
}

function writePropertyToArray(
  value: UIPropertyType,
  array: Float32Array,
  itemOffset: number,
): void {
  if (value instanceof UIColor) {
    const glsl = value.toGLSLColor();
    array[itemOffset] = glsl.x;
    array[itemOffset + 1] = glsl.y;
    array[itemOffset + 2] = glsl.z;
    array[itemOffset + 3] = glsl.w;
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

function buildEmptyInstancedBufferAttribute(
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

function buildMaterial(
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

    // Varying declaractions
    ${varyingDeclarations.join("\n")}

    void main() {
      if (a_instanceVisibility < 0.5) {
        gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
        return;
      }

      ${vertexAssignments.join("\n")}

      v_position = position;
      v_uv = uv;

      gl_Position = projectionMatrix * modelViewMatrix * a_instanceTransform * vec4(position, 1.0);
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
        if (diffuseColor.a < v_alphaTest) {
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

function validateRange(
  descriptor: Descriptor,
  offset: number,
  count: number,
): void {
  if (offset + count > descriptor.count) {
    throw new Error(
      `Range [${offset}, ${offset + count}) exceeds descriptor range [0, ${descriptor.count})`,
    );
  }
}

/**
 * Instanced plane renderer for batching multiple planes with shared shader.
 *
 * Manages a pool of plane instances that share the same material/shader,
 * enabling efficient batched rendering. Instances can be dynamically added,
 * removed, and updated without recreating the underlying geometry.
 *
 * @remarks
 * Memory is pre-allocated in chunks of 16 instances. Removing instances
 * triggers data compaction to maintain contiguous memory layout.
 *
 * Textures in uniforms are not disposed on destroy — caller retains ownership.
 */
export class UIGenericInstancedPlane extends Mesh {
  private readonly handlerToDescriptor = new Map<number, Descriptor>();
  private readonly propertyBuffers = new Map<
    string,
    InstancedBufferAttribute
  >();
  private readonly instancedGeometry: InstancedBufferGeometry;
  private readonly shaderMaterial: ShaderMaterial;
  private readonly userVaryingLayout: Record<string, UIPropertyTypeName>;

  private lastHandler = 0;
  private capacity: number;

  /**
   * Creates a new instanced plane renderer.
   *
   * @param source - GLSL fragment shader source (must define main() using io_UV)
   * @param layout - Map of property names to types for per-instance data
   * @param transparency - Transparency rendering mode
   * @param initialCapacity - Initial instance pool size (rounded up to multiple of 4)
   */
  constructor(
    source: string,
    layout: Record<string, UIPropertyTypeName>,
    transparency: UITransparencyMode = UITransparencyMode.CLIP,
    initialCapacity: number = CAPACITY_STEP,
  ) {
    const uniformLayout: Record<string, UIPropertyTypeName> = {};
    const userVaryingLayout: Record<string, UIPropertyTypeName> = {};

    for (const [name, propertyTypeName] of Object.entries(layout)) {
      const info = resolveTypeInfo(propertyTypeName);
      if (info.instantiable) {
        userVaryingLayout[name] = propertyTypeName;
      } else {
        uniformLayout[name] = propertyTypeName;
      }
    }

    const instancedGeometry = INSTANCED_GEOMETRY.clone();
    const shaderMaterial = buildMaterial(
      source,
      uniformLayout,
      userVaryingLayout,
      transparency,
    );

    super(instancedGeometry, shaderMaterial);

    this.instancedGeometry = instancedGeometry;
    this.instancedGeometry.instanceCount = 0;
    this.shaderMaterial = shaderMaterial;
    this.userVaryingLayout = userVaryingLayout;
    this.capacity = Math.max(
      Math.ceil(initialCapacity / CAPACITY_STEP) * CAPACITY_STEP,
      CAPACITY_STEP,
    );

    this.frustumCulled = false;

    this.initializeBuiltinAttributes();
    this.initializeUserAttributes();
  }

  /**
   * Number of active instances.
   */
  public get instanceCount(): number {
    return this.instancedGeometry.instanceCount;
  }

  /**
   * Allocates new instances and returns a handler for managing them.
   *
   * @param count - Number of instances to allocate
   * @returns Handler for accessing the allocated instances
   *
   * @remarks
   * New instances are initialized with:
   * - visibility = 1 (visible)
   * - identity transform matrix
   * - identity UV transform
   */
  public createInstances(count: number): number {
    if (count <= 0) {
      throw new Error("Instance count must be positive");
    }

    const handler = this.lastHandler++;
    const firstIndex = this.instancedGeometry.instanceCount;

    this.ensureCapacity(firstIndex + count);

    this.handlerToDescriptor.set(handler, { firstIndex, count });
    this.instancedGeometry.instanceCount += count;

    this.initializeInstanceDefaults(firstIndex, count);

    return handler;
  }

  /**
   * Releases instances associated with a handler.
   *
   * @param handler - Handler returned from createInstances
   * @throws Error if handler is invalid
   *
   * @remarks
   * Triggers data compaction. Other handlers remain valid but may
   * reference different internal indices after compaction.
   */
  public destroyInstances(handler: number): void {
    const descriptor = this.handlerToDescriptor.get(handler);
    if (descriptor === undefined) {
      throw new Error(`Invalid handler: ${handler}`);
    }

    this.handlerToDescriptor.delete(handler);

    const gapStart = descriptor.firstIndex;
    const gapEnd = gapStart + descriptor.count;
    const totalInstances = this.instancedGeometry.instanceCount;

    if (gapEnd < totalInstances) {
      this.shiftInstanceData(gapEnd, gapStart, totalInstances - gapEnd);
      this.updateDescriptorIndices(gapEnd, -descriptor.count);
    }

    this.instancedGeometry.instanceCount -= descriptor.count;
  }

  /**
   * Updates per-instance properties.
   *
   * @param handler - Handler returned from createInstances
   * @param offset - Offset within the handler's instance range
   * @param instancesProperties - Array of property objects to apply
   * @throws Error if handler is invalid or offset+count exceeds range
   */
  public updateProperties(
    handler: number,
    offset: number,
    instancesProperties: Record<string, UIPropertyType>[],
  ): void {
    assertValidNonNegativeNumber(offset, "updateProperties offset");

    const descriptor = this.resolveDescriptor(handler);
    validateRange(descriptor, offset, instancesProperties.length);

    for (let i = 0; i < instancesProperties.length; i++) {
      const properties = instancesProperties[i];
      const instanceIndex = descriptor.firstIndex + offset + i;

      for (const [name, value] of Object.entries(properties)) {
        const typeInfo = resolveTypeInfo(value);

        if (typeInfo.instantiable) {
          const attribute = this.resolveAttribute(name);
          const itemOffset = instanceIndex * attribute.itemSize;
          writePropertyToArray(
            value,
            attribute.array as Float32Array,
            itemOffset,
          );
          attribute.needsUpdate = true;
        } else {
          const uniform = this.resolveUniform(name);
          uniform.value = value;
          this.shaderMaterial.uniformsNeedUpdate = true;
        }
      }
    }
  }

  /**
   * Updates instance transform matrices.
   *
   * @param handler - Handler returned from createInstances
   * @param offset - Offset within the handler's instance range
   * @param transforms - Array of Matrix4 transforms to apply
   */
  public updateTransforms(
    handler: number,
    offset: number,
    transforms: Matrix4[],
  ): void {
    assertValidNonNegativeNumber(offset, "updateTransforms offset");

    const descriptor = this.resolveDescriptor(handler);
    validateRange(descriptor, offset, transforms.length);

    const attribute = this.resolveAttribute("instanceTransform");
    const array = attribute.array as Float32Array;

    for (let i = 0; i < transforms.length; i++) {
      const instanceIndex = descriptor.firstIndex + offset + i;
      const itemOffset = instanceIndex * attribute.itemSize;
      const elements = transforms[i].elements;

      for (let j = 0; j < elements.length; j++) {
        array[itemOffset + j] = elements[j];
      }
    }

    attribute.needsUpdate = true;
  }

  /**
   * Updates instance visibility flags.
   *
   * @param handler - Handler returned from createInstances
   * @param offset - Offset within the handler's instance range
   * @param visibility - Array of boolean visibility values
   */
  public updateVisibility(
    handler: number,
    offset: number,
    visibility: boolean[],
  ): void {
    assertValidNonNegativeNumber(offset, "updateVisibility offset");

    const descriptor = this.resolveDescriptor(handler);
    validateRange(descriptor, offset, visibility.length);

    const attribute = this.resolveAttribute("instanceVisibility");
    const array = attribute.array as Float32Array;

    for (let i = 0; i < visibility.length; i++) {
      const instanceIndex = descriptor.firstIndex + offset + i;
      array[instanceIndex] = visibility[i] ? 1 : 0;
    }

    attribute.needsUpdate = true;
  }

  /**
   * Disposes geometry and material resources.
   *
   * @remarks
   * Textures in uniforms are not disposed — caller retains ownership.
   */
  public destroy(): void {
    this.instancedGeometry.dispose();
    this.shaderMaterial.dispose();
    this.propertyBuffers.clear();
    this.handlerToDescriptor.clear();
  }

  private initializeBuiltinAttributes(): void {
    const builtins: [string, number][] = [
      ["instanceVisibility", 1],
      ["instanceTransform", 16],
    ];

    for (const [name, itemSize] of builtins) {
      const attribute = new InstancedBufferAttribute(
        new Float32Array(this.capacity * itemSize),
        itemSize,
      );
      this.instancedGeometry.setAttribute(`a_${name}`, attribute);
      this.propertyBuffers.set(name, attribute);
    }
  }

  private initializeUserAttributes(): void {
    for (const [name, typeName] of Object.entries(this.userVaryingLayout)) {
      const attribute = buildEmptyInstancedBufferAttribute(
        typeName,
        this.capacity,
      );
      this.instancedGeometry.setAttribute(`a_${name}`, attribute);
      this.propertyBuffers.set(name, attribute);
    }
  }

  private initializeInstanceDefaults(firstIndex: number, count: number): void {
    const visibilityAttribute = this.propertyBuffers.get(
      "instanceVisibility",
    ) as InstancedBufferAttribute;
    const transformAttribute = this.propertyBuffers.get(
      "instanceTransform",
    ) as InstancedBufferAttribute;

    const visibilityArray = visibilityAttribute.array as Float32Array;
    const transformArray = transformAttribute.array as Float32Array;

    const identityMatrix4 = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];

    for (let i = 0; i < count; i++) {
      const idx = firstIndex + i;

      visibilityArray[idx] = DEFAULT_VISIBILITY;

      const transformOffset = idx * 16;
      for (let j = 0; j < 16; j++) {
        transformArray[transformOffset + j] = identityMatrix4[j];
      }
    }

    visibilityAttribute.needsUpdate = true;
    transformAttribute.needsUpdate = true;
  }

  private ensureCapacity(requiredCapacity: number): void {
    if (requiredCapacity <= this.capacity) {
      return;
    }

    const newCapacity =
      Math.ceil(requiredCapacity / CAPACITY_STEP) * CAPACITY_STEP;

    for (const [name, oldAttribute] of this.propertyBuffers.entries()) {
      const itemSize = oldAttribute.itemSize;
      const newArray = new Float32Array(newCapacity * itemSize);
      newArray.set(oldAttribute.array as Float32Array);

      const newAttribute = new InstancedBufferAttribute(newArray, itemSize);
      this.instancedGeometry.setAttribute(`a_${name}`, newAttribute);
      this.propertyBuffers.set(name, newAttribute);
    }

    this.capacity = newCapacity;
  }

  private shiftInstanceData(
    sourceStart: number,
    targetStart: number,
    count: number,
  ): void {
    for (const attribute of this.propertyBuffers.values()) {
      const array = attribute.array as Float32Array;
      const itemSize = attribute.itemSize;

      const srcOffset = sourceStart * itemSize;
      const dstOffset = targetStart * itemSize;
      const length = count * itemSize;

      array.copyWithin(dstOffset, srcOffset, srcOffset + length);
      attribute.needsUpdate = true;
    }
  }

  private updateDescriptorIndices(threshold: number, delta: number): void {
    for (const descriptor of this.handlerToDescriptor.values()) {
      if (descriptor.firstIndex >= threshold) {
        descriptor.firstIndex += delta;
      }
    }
  }

  private resolveDescriptor(handler: number): Descriptor {
    const descriptor = this.handlerToDescriptor.get(handler);
    if (descriptor === undefined) {
      throw new Error(`Invalid handler: ${handler}`);
    }
    return descriptor;
  }

  private resolveAttribute(name: string): InstancedBufferAttribute {
    const attribute = this.propertyBuffers.get(name);
    if (attribute === undefined) {
      throw new Error(`Unknown attribute: ${name}`);
    }
    return attribute;
  }

  private resolveUniform(name: string): IUniform<unknown> {
    const uniform = this.shaderMaterial.uniforms[`u_${name}`] as
      | IUniform<unknown>
      | undefined;
    if (uniform === undefined) {
      throw new Error(`Unknown uniform: ${name}`);
    }
    return uniform;
  }
}

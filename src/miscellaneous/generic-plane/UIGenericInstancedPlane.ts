import type { InstancedBufferGeometry, Matrix4, ShaderMaterial } from "three";
import { InstancedBufferAttribute, Mesh } from "three";
import { assertValidNonNegativeNumber } from "../asserts";
import { UITransparencyMode } from "../UITransparencyMode";
import type { UIPropertyType, UIPropertyTypeName } from "./shared";
import { DEFAULT_VISIBILITY, resolveTypeInfo, resolveUniform } from "./shared";
import type { InstancedRangeDescriptor } from "./UIGenericInstancedPlane.Internal";
import {
  buildEmptyInstancedBufferAttribute,
  buildMaterial,
  CAPACITY_STEP,
  INSTANCED_PLANE_GEOMETRY,
  validateRange,
  writePropertyToArray,
} from "./UIGenericInstancedPlane.Internal";

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
  private readonly handlerToDescriptor = new Map<
    number,
    InstancedRangeDescriptor
  >();
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
    private readonly source: string,
    private readonly layout: Record<string, UIPropertyTypeName>,
    private readonly transparency: UITransparencyMode = UITransparencyMode.BLEND,
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

    const instancedGeometry = INSTANCED_PLANE_GEOMETRY.clone();
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
          const uniform = resolveUniform(name, this.shaderMaterial);
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
   * Checks if the provided configuration is compatible with this instance.
   *
   * @param source - GLSL fragment shader source
   * @param layout - Map of property names to types for per-instance data
   * @param transparency - Transparency rendering mode
   * @returns true if the configuration matches the current instance, false otherwise
   */
  public isCompatible(
    source: string,
    layout: Record<string, UIPropertyTypeName>,
    transparency: UITransparencyMode = UITransparencyMode.BLEND,
  ): boolean {
    if (this.source !== source || this.transparency !== transparency) {
      return false;
    }

    const layoutKeys = Object.keys(layout);
    const currentLayoutKeys = Object.keys(this.layout);

    if (layoutKeys.length !== currentLayoutKeys.length) {
      return false;
    }

    for (const key of layoutKeys) {
      if (this.layout[key] !== layout[key]) {
        return false;
      }
    }

    return true;
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

  private resolveDescriptor(handler: number): InstancedRangeDescriptor {
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
}

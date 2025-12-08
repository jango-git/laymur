import type { InstancedBufferGeometry, ShaderMaterial } from "three";
import { InstancedBufferAttribute, Matrix4, Mesh } from "three";
import { UITransparencyMode } from "../UITransparencyMode";
import type { PlaneInstanceData, UIPropertyType } from "./shared";
import {
  arePropertiesCompatible,
  resolveTypeInfo,
  resolveUniform,
} from "./shared";
import {
  buildEmptyInstancedBufferAttribute,
  buildMaterial,
  CAPACITY_STEP,
  INSTANCED_PLANE_GEOMETRY,
  reconstructValue,
  writeInstanceDefaults,
  writePropertyToArray,
} from "./UIGenericInstancedPlane.Internal";

/**
 * Instanced plane renderer for batching multiple planes with shared shader.
 *
 * Manages a pool of plane instances that share the same material/shader,
 * enabling efficient batched rendering. Each handler corresponds to exactly
 * one instance.
 *
 * @remarks
 * Memory is pre-allocated in chunks of 4 instances. Removing instances
 * triggers data compaction to maintain contiguous memory layout.
 *
 * Textures in uniforms are not disposed on destroy — caller retains ownership.
 */
export class UIGenericInstancedPlane extends Mesh {
  private readonly handlerToIndex = new Map<number, number>();
  private readonly propertyBuffers = new Map<
    string,
    InstancedBufferAttribute
  >();
  private readonly instancedGeometry: InstancedBufferGeometry;
  private readonly shaderMaterial: ShaderMaterial;

  private readonly uniformProperties: Record<string, UIPropertyType>;
  private readonly varyingProperties: Record<string, UIPropertyType>;

  private lastHandler = 0;
  private capacity: number;

  /**
   * Creates a new instanced plane renderer.
   *
   * @param source - GLSL fragment shader source (must define vec4 draw() function)
   * @param properties - Map of property names to values
   * @param transparency - Transparency rendering mode
   * @param initialCapacity - Initial instance pool size (rounded up to multiple of 4)
   */
  constructor(
    public readonly source: string,
    properties: Record<string, UIPropertyType>,
    public readonly transparency: UITransparencyMode = UITransparencyMode.BLEND,
    initialCapacity: number = CAPACITY_STEP,
  ) {
    const uniformProperties: Record<string, UIPropertyType> = {};
    const varyingProperties: Record<string, UIPropertyType> = {
      instanceVisibility: 1,
      instanceTransform: new Matrix4().identity(),
    };

    for (const [name, value] of Object.entries(properties)) {
      const info = resolveTypeInfo(value);
      if (info.instantiable) {
        varyingProperties[name] = value;
      } else {
        uniformProperties[name] = value;
      }
    }

    const instancedGeometry = INSTANCED_PLANE_GEOMETRY.clone();
    const shaderMaterial = buildMaterial(
      source,
      uniformProperties,
      varyingProperties,
      transparency,
    );

    super(instancedGeometry, shaderMaterial);

    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
    this.matrixWorldAutoUpdate = false;

    this.instancedGeometry = instancedGeometry;
    this.instancedGeometry.instanceCount = 0;
    this.shaderMaterial = shaderMaterial;
    this.uniformProperties = uniformProperties;
    this.varyingProperties = varyingProperties;
    this.capacity = Math.max(
      Math.ceil(initialCapacity / CAPACITY_STEP) * CAPACITY_STEP,
      CAPACITY_STEP,
    );

    {
      for (const [name, value] of Object.entries(this.varyingProperties)) {
        const attribute = buildEmptyInstancedBufferAttribute(
          value,
          this.capacity,
        );
        this.instancedGeometry.setAttribute(`a_${name}`, attribute);
        this.propertyBuffers.set(name, attribute);
      }
    }

    {
      for (const [name, value] of Object.entries(this.uniformProperties)) {
        const uniform = resolveUniform(name, this.shaderMaterial);
        uniform.value = value;
      }
      this.shaderMaterial.uniformsNeedUpdate = true;
    }
  }

  /**
   * Number of active instances.
   */
  public get instanceCount(): number {
    return this.instancedGeometry.instanceCount;
  }

  /**
   * Returns a copy of all properties (uniform + varying).
   */
  public get properties(): Record<string, UIPropertyType> {
    return { ...this.uniformProperties, ...this.varyingProperties };
  }

  /**
   * Allocates a new instance and returns a handler for managing it.
   *
   * @returns Handler for accessing the allocated instance
   *
   * @remarks
   * New instance is initialized with:
   * - visibility = 1 (visible)
   * - identity transform matrix
   */
  public createInstance(): number {
    const handler = this.lastHandler++;
    const index = this.instancedGeometry.instanceCount;

    this.ensureCapacity(index + 1);

    this.handlerToIndex.set(handler, index);
    this.instancedGeometry.instanceCount++;

    this.initializeInstanceDefaults(index);

    return handler;
  }

  /**
   * Releases an instance associated with a handler.
   *
   * @param handler - Handler returned from createInstance
   * @throws Error if handler is invalid
   *
   * @remarks
   * Triggers data compaction. Other handlers remain valid but may
   * reference different internal indices after compaction.
   */
  public destroyInstance(handler: number): void {
    const index = this.resolveIndex(handler);

    this.handlerToIndex.delete(handler);

    const lastIndex = this.instancedGeometry.instanceCount - 1;

    if (index < lastIndex) {
      this.moveInstanceData(lastIndex, index);
      this.updateIndicesAfterMove(lastIndex, index);
    }

    this.instancedGeometry.instanceCount--;
  }

  /**
   * Updates instance properties.
   *
   * @param handler - Handler returned from createInstance
   * @param properties - Properties to apply
   */
  public setProperties(
    handler: number,
    properties: Record<string, UIPropertyType>,
  ): void {
    const index = this.resolveIndex(handler);

    for (const [name, value] of Object.entries(properties)) {
      const typeInfo = resolveTypeInfo(value);

      if (typeInfo.instantiable) {
        const attribute = this.resolveAttribute(name);
        const offset = index * attribute.itemSize;
        writePropertyToArray(value, attribute.array as Float32Array, offset);
        attribute.needsUpdate = true;
      } else {
        const uniform = resolveUniform(name, this.shaderMaterial);
        uniform.value = value;
        this.shaderMaterial.uniformsNeedUpdate = true;
      }
    }
  }

  /**
   * Updates instance transform matrix.
   *
   * @param handler - Handler returned from createInstance
   * @param transform - Matrix4 transform to apply
   */
  public setTransform(handler: number, transform: Matrix4): void {
    const index = this.resolveIndex(handler);

    const attribute = this.resolveAttribute("instanceTransform");
    const array = attribute.array as Float32Array;
    const offset = index * 16;

    const elements = transform.elements;
    for (let j = 0; j < 16; j++) {
      array[offset + j] = elements[j];
    }

    attribute.needsUpdate = true;
  }

  /**
   * Updates instance visibility.
   *
   * @param handler - Handler returned from createInstance
   * @param visible - Whether the instance should be visible
   */
  public setVisibility(handler: number, visible: boolean): void {
    const index = this.resolveIndex(handler);

    const attribute = this.resolveAttribute("instanceVisibility");
    const array = attribute.array as Float32Array;
    array[index] = visible ? 1 : 0;

    attribute.needsUpdate = true;
  }

  /**
   * Checks if the provided configuration is compatible with this plane.
   *
   * @param source - GLSL fragment shader source
   * @param properties - Map of property names to values
   * @param transparency - Transparency rendering mode
   * @returns true if the configuration matches, false otherwise
   */
  public isCompatible(
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode = UITransparencyMode.BLEND,
  ): boolean {
    if (this.source !== source || this.transparency !== transparency) {
      return false;
    }

    return arePropertiesCompatible(this.properties, properties);
  }

  /**
   * Checks if the provided properties are compatible (ignoring source/transparency).
   *
   * @param properties - Map of property names to values
   * @returns true if properties are compatible
   */
  public arePropertiesCompatible(
    properties: Record<string, UIPropertyType>,
  ): boolean {
    return arePropertiesCompatible(this.properties, properties);
  }

  /**
   * Extracts complete instance data.
   *
   * @param handler - Handler returned from createInstance
   * @returns Complete instance data for relocation
   */
  public extractInstanceData(handler: number): PlaneInstanceData {
    return {
      source: this.source,
      properties: this.extractProperties(handler),
      transparency: this.transparency,
      transform: this.extractTransform(handler),
      visibility: this.extractVisibility(handler),
    };
  }

  /**
   * Extracts properties for a specific instance.
   *
   * @param handler - Handler returned from createInstance
   * @returns Properties object reconstructed from instance data
   */
  public extractProperties(handler: number): Record<string, UIPropertyType> {
    const index = this.resolveIndex(handler);
    const result: Record<string, UIPropertyType> = {};

    for (const [name, value] of Object.entries(this.uniformProperties)) {
      result[name] = value;
    }

    for (const [name, referenceValue] of Object.entries(
      this.varyingProperties,
    )) {
      const attribute = this.propertyBuffers.get(
        name,
      ) as InstancedBufferAttribute;
      const array = attribute.array as Float32Array;
      const offset = index * attribute.itemSize;
      result[name] = reconstructValue(referenceValue, array, offset);
    }

    return result;
  }

  /**
   * Extracts transform matrix for a specific instance.
   *
   * @param handler - Handler returned from createInstance
   * @returns Matrix4 transform
   */
  public extractTransform(handler: number): Matrix4 {
    const index = this.resolveIndex(handler);
    const attribute = this.propertyBuffers.get(
      "instanceTransform",
    ) as InstancedBufferAttribute;
    const array = attribute.array as Float32Array;

    const matrix = new Matrix4();
    matrix.fromArray(array, index * 16);
    return matrix;
  }

  /**
   * Extracts visibility flag for a specific instance.
   *
   * @param handler - Handler returned from createInstance
   * @returns boolean visibility
   */
  public extractVisibility(handler: number): boolean {
    const index = this.resolveIndex(handler);
    const attribute = this.propertyBuffers.get(
      "instanceVisibility",
    ) as InstancedBufferAttribute;
    const array = attribute.array as Float32Array;
    return array[index] >= 0.5;
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
    this.handlerToIndex.clear();
  }

  private initializeInstanceDefaults(index: number): void {
    const visibilityAttr = this.propertyBuffers.get(
      "instanceVisibility",
    ) as InstancedBufferAttribute;
    const transformAttr = this.propertyBuffers.get(
      "instanceTransform",
    ) as InstancedBufferAttribute;

    writeInstanceDefaults(
      visibilityAttr.array as Float32Array,
      transformAttr.array as Float32Array,
      index,
    );

    visibilityAttr.needsUpdate = true;
    transformAttr.needsUpdate = true;
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

  /**
   * Moves instance data from source index to target index.
   * Used for compaction when removing instances.
   */
  private moveInstanceData(sourceIndex: number, targetIndex: number): void {
    for (const attribute of this.propertyBuffers.values()) {
      const array = attribute.array as Float32Array;
      const itemSize = attribute.itemSize;

      const srcOffset = sourceIndex * itemSize;
      const dstOffset = targetIndex * itemSize;

      for (let i = 0; i < itemSize; i++) {
        array[dstOffset + i] = array[srcOffset + i];
      }

      attribute.needsUpdate = true;
    }
  }

  /**
   * Updates handler-to-index mapping after moving an instance.
   */
  private updateIndicesAfterMove(oldIndex: number, newIndex: number): void {
    for (const [handler, index] of this.handlerToIndex) {
      if (index === oldIndex) {
        this.handlerToIndex.set(handler, newIndex);
        break;
      }
    }
  }

  private resolveIndex(handler: number): number {
    const index = this.handlerToIndex.get(handler);
    if (index === undefined) {
      throw new Error(`Invalid handler: ${handler}`);
    }
    return index;
  }

  private resolveAttribute(name: string): InstancedBufferAttribute {
    const attribute = this.propertyBuffers.get(name);
    if (attribute === undefined) {
      throw new Error(`Unknown attribute: ${name}`);
    }
    return attribute;
  }
}

import type { InstancedBufferGeometry, ShaderMaterial } from "three";
import { InstancedBufferAttribute, Matrix4, Mesh } from "three";
import type { UITransparencyMode } from "../../UITransparencyMode";
import type { GLProperty, PlaneData } from "../shared";
import {
  arePropertiesPartiallyCompatible,
  cloneGLProperties,
  cloneProperty,
  extractZIndexFromBuffer,
  resolveGLSLTypeInfo,
  resolvePropertyUniform,
} from "../shared";
import {
  buildEmptyInstancedBufferAttribute,
  buildMaterial,
  CAPACITY_STEP,
  copyBetweenBuffers,
  INITIAL_CAPACITY,
  INSTANCED_PLANE_GEOMETRY,
  reconstructValue,
  shiftBufferRegion,
  writePropertyToArray,
} from "./UIGenericInstancedPlane.Internal";

/**
 * Instanced shader plane mesh for batched rendering.
 *
 * Operates on indices, not handlers. Registry manages handler→index mapping.
 * Elements are ordered by zIndex (ascending) within the buffer.
 *
 * @internal
 */
export class UIGenericInstancedPlane extends Mesh {
  public readonly source: string;
  public readonly transparency: UITransparencyMode;

  private readonly instancedGeometry: InstancedBufferGeometry;
  private readonly shaderMaterial: ShaderMaterial;
  private readonly uniformProperties: Record<string, GLProperty>;
  private readonly varyingProperties: Record<string, GLProperty>;
  private readonly propertyBuffers: Map<string, InstancedBufferAttribute>;

  private capacity: number;
  private instancesCountInternal: number;

  constructor(
    source: string,
    properties: Record<string, GLProperty>,
    transparency: UITransparencyMode,
    initialCapacity: number = INITIAL_CAPACITY,
  ) {
    const uniformProperties: Record<string, GLProperty> = {};
    const varyingProperties: Record<string, GLProperty> = {
      instanceVisibility: {
        value: 1,
        glslTypeInfo: resolveGLSLTypeInfo("number"),
      },
      instanceTransform: {
        value: new Matrix4().identity(),
        glslTypeInfo: resolveGLSLTypeInfo("Matrix4"),
      },
    };

    for (const name in properties) {
      const descriptor = properties[name];
      if (descriptor.glslTypeInfo.instantiable) {
        varyingProperties[name] = descriptor;
      } else {
        uniformProperties[name] = descriptor;
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

    this.source = source;
    this.transparency = transparency;
    this.instancedGeometry = instancedGeometry;
    this.shaderMaterial = shaderMaterial;
    this.uniformProperties = uniformProperties;
    this.varyingProperties = varyingProperties;
    this.propertyBuffers = new Map();

    this.capacity = Math.max(
      Math.ceil(initialCapacity / CAPACITY_STEP) * CAPACITY_STEP,
      CAPACITY_STEP,
    );
    this.instancesCountInternal = 0;
    this.instancedGeometry.instanceCount = 0;

    for (const name in this.varyingProperties) {
      const { value } = this.varyingProperties[name];
      const attribute = buildEmptyInstancedBufferAttribute(
        value,
        this.capacity,
      );
      this.instancedGeometry.setAttribute(`a_${name}`, attribute);
      this.propertyBuffers.set(name, attribute);
    }

    for (const name in this.uniformProperties) {
      const { value } = this.uniformProperties[name];
      const uniform = resolvePropertyUniform(name, this.shaderMaterial);
      uniform.value = value;
    }
    this.shaderMaterial.uniformsNeedUpdate = true;
  }

  /** Current number of active instances */
  public get instancesCount(): number {
    return this.instancesCountInternal;
  }

  /**
   * Insert instance at given index. Elements at [index..end) are shifted right.
   */
  public insertAt(
    index: number,
    properties: Record<string, GLProperty>,
    transform: Matrix4,
    visibility: boolean,
  ): void {
    if (index < 0 || index > this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.insertAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    this.ensureCapacity(this.instancesCountInternal + 1);

    if (index < this.instancesCountInternal) {
      this.shiftBuffersRight(index, 1);
    }

    this.writeToBuffers(index, properties, transform, visibility);

    this.instancesCountInternal++;
    this.instancedGeometry.instanceCount = this.instancesCountInternal;
  }

  /**
   * Remove instance at given index. Elements at [index+1..end) are shifted left.
   */
  public removeAt(index: number): void {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.removeAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    if (index < this.instancesCountInternal - 1) {
      this.shiftBuffersLeft(index + 1, 1);
    }

    this.instancesCountInternal--;
    this.instancedGeometry.instanceCount = this.instancesCountInternal;
  }

  /** Update properties at given index */
  public setPropertiesAt(
    index: number,
    properties: Record<string, GLProperty>,
  ): void {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.setPropertiesAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    for (const name in properties) {
      const { value, glslTypeInfo } = properties[name];

      if (glslTypeInfo.instantiable) {
        const attribute = this.resolveAttribute(name);
        const offset = index * attribute.itemSize;
        writePropertyToArray(value, attribute.array as Float32Array, offset);
        attribute.needsUpdate = true;
      } else {
        const uniform = resolvePropertyUniform(name, this.shaderMaterial);
        uniform.value = value;
        this.shaderMaterial.uniformsNeedUpdate = true;
      }
    }
  }

  /** Update transform at given index */
  public setTransformAt(index: number, transform: Matrix4): void {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.setTransformAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    const attribute = this.resolveAttribute("instanceTransform");
    const array = attribute.array as Float32Array;
    const offset = index * 16;

    const elements = transform.elements;
    for (let j = 0; j < 16; j++) {
      array[offset + j] = elements[j];
    }
    attribute.needsUpdate = true;
  }

  /** Update visibility at given index */
  public setVisibilityAt(index: number, visible: boolean): void {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.setVisibilityAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    const attribute = this.resolveAttribute("instanceVisibility");
    const array = attribute.array as Float32Array;
    array[index] = visible ? 1 : 0;
    attribute.needsUpdate = true;
  }

  /**
   * Extract complete instance data at given index.
   * Returns cloned data safe for external use.
   */
  public extractDataAt(index: number): PlaneData {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.extractDataAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    const properties: Record<string, GLProperty> = {};

    for (const name in this.uniformProperties) {
      const prop = this.uniformProperties[name];
      properties[name] = {
        value: cloneProperty(prop.value),
        glslTypeInfo: prop.glslTypeInfo,
      };
    }

    for (const name in this.varyingProperties) {
      if (name === "instanceVisibility" || name === "instanceTransform") {
        continue;
      }

      const { value, glslTypeInfo } = this.varyingProperties[name];
      const attribute = this.propertyBuffers.get(
        name,
      ) as InstancedBufferAttribute;
      const array = attribute.array as Float32Array;
      const offset = index * attribute.itemSize;

      properties[name] = {
        value: reconstructValue(value, array, offset),
        glslTypeInfo,
      };
    }

    const transformAttribute = this.propertyBuffers.get(
      "instanceTransform",
    ) as InstancedBufferAttribute;
    const transformArray = transformAttribute.array as Float32Array;
    const transform = new Matrix4();
    transform.fromArray(transformArray, index * 16);

    const visibilityAttribute = this.propertyBuffers.get(
      "instanceVisibility",
    ) as InstancedBufferAttribute;
    const visibilityArray = visibilityAttribute.array as Float32Array;
    const visibility = visibilityArray[index] >= 0.5;

    return {
      source: this.source,
      properties,
      transform,
      visibility,
      transparency: this.transparency,
    };
  }

  /** Get zIndex at given index (from transform buffer) */
  public getZIndexAt(index: number): number {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.getZIndexAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    const attribute = this.propertyBuffers.get(
      "instanceTransform",
    ) as InstancedBufferAttribute;
    return extractZIndexFromBuffer(attribute.array as Float32Array, index);
  }

  /**
   * Merge another instanced plane into this one (append).
   * Other plane becomes empty after merge.
   */
  public merge(other: UIGenericInstancedPlane): void {
    if (other.instancesCountInternal === 0) {
      return;
    }

    this.ensureCapacity(
      this.instancesCountInternal + other.instancesCountInternal,
    );

    for (const [name, thisAttribute] of this.propertyBuffers) {
      const otherAttribute = other.propertyBuffers.get(name);
      if (!otherAttribute) {
        throw new Error(
          `UIGenericInstancedPlane.merge: missing attribute ${name} in source`,
        );
      }

      const itemSize = thisAttribute.itemSize;
      const srcArray = otherAttribute.array as Float32Array;
      const dstArray = thisAttribute.array as Float32Array;

      copyBetweenBuffers(
        srcArray,
        0,
        dstArray,
        this.instancesCountInternal * itemSize,
        other.instancesCountInternal * itemSize,
      );

      thisAttribute.needsUpdate = true;
    }

    this.instancesCountInternal += other.instancesCountInternal;
    this.instancedGeometry.instanceCount = this.instancesCountInternal;

    other.instancesCountInternal = 0;
    other.instancedGeometry.instanceCount = 0;
  }

  /**
   * Split this plane at given index.
   * Returns new plane with elements [atIndex..end).
   * This plane keeps elements [0..atIndex).
   */
  public split(atIndex: number): UIGenericInstancedPlane {
    if (atIndex <= 0 || atIndex >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.split.atIndex: must be in range (0, count) (atIndex=${atIndex}, count=${this.instancesCountInternal})`,
      );
    }

    const tailCount = this.instancesCountInternal - atIndex;

    const newPlane = new UIGenericInstancedPlane(
      this.source,
      cloneGLProperties({
        ...this.uniformProperties,
        ...this.varyingProperties,
      }),
      this.transparency,
      tailCount,
    );

    for (const [name, thisAttribute] of this.propertyBuffers) {
      const newAttribute = newPlane.propertyBuffers.get(name);
      if (!newAttribute) {
        throw new Error(
          `UIGenericInstancedPlane.split: missing attribute ${name} in new plane`,
        );
      }

      const itemSize = thisAttribute.itemSize;
      const srcArray = thisAttribute.array as Float32Array;
      const dstArray = newAttribute.array as Float32Array;

      copyBetweenBuffers(
        srcArray,
        atIndex * itemSize,
        dstArray,
        0,
        tailCount * itemSize,
      );

      newAttribute.needsUpdate = true;
    }

    newPlane.instancesCountInternal = tailCount;
    newPlane.instancedGeometry.instanceCount = tailCount;

    this.instancesCountInternal = atIndex;
    this.instancedGeometry.instanceCount = atIndex;

    return newPlane;
  }

  /**
   * Check if this plane can accept elements with given parameters.
   */
  public isCompatibleWith(
    source: string,
    properties: Record<string, GLProperty>,
    transparency: UITransparencyMode,
  ): boolean {
    if (this.source !== source) {
      return false;
    }

    if (this.transparency !== transparency) {
      return false;
    }

    const result = arePropertiesPartiallyCompatible(
      { ...this.uniformProperties, ...this.varyingProperties },
      properties,
    );

    return result;
  }

  /** Get all properties configuration (for compatibility checks) */
  public getProperties(): Record<string, GLProperty> {
    return { ...this.uniformProperties, ...this.varyingProperties };
  }

  /** Remove all instances, reset to empty state */
  public clearInstances(): void {
    this.instancesCountInternal = 0;
    this.instancedGeometry.instanceCount = 0;
  }

  /** Dispose geometry, material, and clear buffers */
  public destroy(): void {
    this.instancedGeometry.dispose();
    this.shaderMaterial.dispose();
    this.propertyBuffers.clear();
  }

  private ensureCapacity(requiredCapacity: number): void {
    if (requiredCapacity <= this.capacity) {
      return;
    }

    const newCapacity =
      Math.ceil(requiredCapacity / CAPACITY_STEP) * CAPACITY_STEP;

    for (const [name, oldAttribute] of this.propertyBuffers) {
      const itemSize = oldAttribute.itemSize;
      const newArray = new Float32Array(newCapacity * itemSize);
      newArray.set(oldAttribute.array as Float32Array);

      const newAttribute = new InstancedBufferAttribute(newArray, itemSize);
      this.instancedGeometry.setAttribute(`a_${name}`, newAttribute);
      this.propertyBuffers.set(name, newAttribute);
    }

    this.capacity = newCapacity;
  }

  private shiftBuffersRight(fromIndex: number, delta: number): void {
    const elementsToMove = this.instancesCountInternal - fromIndex;
    if (elementsToMove <= 0) {
      return;
    }

    for (const attribute of this.propertyBuffers.values()) {
      shiftBufferRegion(
        attribute.array as Float32Array,
        attribute.itemSize,
        fromIndex,
        elementsToMove,
        delta,
      );
      attribute.needsUpdate = true;
    }
  }

  private shiftBuffersLeft(fromIndex: number, delta: number): void {
    const elementsToMove = this.instancesCountInternal - fromIndex;
    if (elementsToMove <= 0) {
      return;
    }

    for (const attribute of this.propertyBuffers.values()) {
      shiftBufferRegion(
        attribute.array as Float32Array,
        attribute.itemSize,
        fromIndex,
        elementsToMove,
        -delta,
      );
      attribute.needsUpdate = true;
    }
  }

  private writeToBuffers(
    index: number,
    properties: Record<string, GLProperty>,
    transform: Matrix4,
    visibility: boolean,
  ): void {
    const visibilityAttribute = this.resolveAttribute("instanceVisibility");
    (visibilityAttribute.array as Float32Array)[index] = visibility ? 1 : 0;
    visibilityAttribute.needsUpdate = true;

    const transformAttribute = this.resolveAttribute("instanceTransform");
    const transformArray = transformAttribute.array as Float32Array;
    const transformOffset = index * 16;
    const elements = transform.elements;
    for (let j = 0; j < 16; j++) {
      transformArray[transformOffset + j] = elements[j];
    }
    transformAttribute.needsUpdate = true;

    for (const name in properties) {
      const { value, glslTypeInfo } = properties[name];

      if (glslTypeInfo.instantiable) {
        const attribute = this.propertyBuffers.get(name);
        if (attribute) {
          const offset = index * attribute.itemSize;
          writePropertyToArray(value, attribute.array as Float32Array, offset);
          attribute.needsUpdate = true;
        }
      } else {
        const uniform = resolvePropertyUniform(name, this.shaderMaterial);
        uniform.value = value;
        this.shaderMaterial.uniformsNeedUpdate = true;
      }
    }
  }

  private resolveAttribute(name: string): InstancedBufferAttribute {
    const attribute = this.propertyBuffers.get(name);
    if (attribute === undefined) {
      throw new Error(
        `UIGenericInstancedPlane.resolveAttribute.name: unknown attribute "${name}"`,
      );
    }
    return attribute;
  }
}

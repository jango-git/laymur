import type { InstancedBufferGeometry, ShaderMaterial } from "three";
import { InstancedBufferAttribute, Matrix4, Mesh } from "three";
import { UITransparencyMode } from "../../UITransparencyMode";
import type { GLProperty, PlaneData } from "../shared";
import {
  arePropertiesPartiallyCompatible,
  resolveGLSLTypeInfo,
  resolvePropertyUniform,
} from "../shared";
import {
  buildEmptyInstancedBufferAttribute,
  buildMaterial,
  CAPACITY_STEP,
  INSTANCED_PLANE_GEOMETRY,
  reconstructValue,
  writeInstanceDefaults,
  writePropertyToArray,
} from "./UIGenericInstancedPlane.Internal";

export class UIGenericInstancedPlane extends Mesh {
  private readonly instancedGeometry: InstancedBufferGeometry;
  private readonly shaderMaterial: ShaderMaterial;

  private readonly handlerToIndex = new Map<number, number>();
  private readonly propertyBuffers = new Map<
    string,
    InstancedBufferAttribute
  >();

  private readonly uniformProperties: Record<string, GLProperty>;
  private readonly varyingProperties: Record<string, GLProperty>;

  private lastHandler = 0;
  private capacity: number;

  constructor(
    public readonly source: string,
    properties: Record<string, GLProperty>,
    public readonly transparency: UITransparencyMode,
    initialCapacity: number = CAPACITY_STEP,
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
      for (const name in this.varyingProperties) {
        const { value } = this.varyingProperties[name];
        const attribute = buildEmptyInstancedBufferAttribute(
          value,
          this.capacity,
        );
        this.instancedGeometry.setAttribute(`a_${name}`, attribute);
        this.propertyBuffers.set(name, attribute);
      }
    }

    {
      for (const name in this.uniformProperties) {
        const { value } = this.uniformProperties[name];
        const uniform = resolvePropertyUniform(name, this.shaderMaterial);
        uniform.value = value;
      }
      this.shaderMaterial.uniformsNeedUpdate = true;
    }
  }

  public get instanceCount(): number {
    return this.instancedGeometry.instanceCount;
  }

  public createInstance(): number {
    const handler = this.lastHandler++;
    const index = this.instancedGeometry.instanceCount;

    {
      this.ensureCapacity(index + 1);
      this.handlerToIndex.set(handler, index);
      this.instancedGeometry.instanceCount++;
    }

    {
      const visibilityBufferAttribute = this.propertyBuffers.get(
        "instanceVisibility",
      ) as InstancedBufferAttribute;
      const transformBufferAttribute = this.propertyBuffers.get(
        "instanceTransform",
      ) as InstancedBufferAttribute;

      writeInstanceDefaults(
        visibilityBufferAttribute.array as Float32Array,
        transformBufferAttribute.array as Float32Array,
        index,
      );

      visibilityBufferAttribute.needsUpdate = true;
      transformBufferAttribute.needsUpdate = true;
    }

    return handler;
  }

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

  public setProperties(
    handler: number,
    properties: Record<string, GLProperty>,
  ): void {
    const index = this.resolveIndex(handler);

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

  public setVisibility(handler: number, visible: boolean): void {
    const index = this.resolveIndex(handler);

    const attribute = this.resolveAttribute("instanceVisibility");
    const array = attribute.array as Float32Array;
    array[index] = visible ? 1 : 0;

    attribute.needsUpdate = true;
  }

  public isPartiallyCompatible(
    source: string,
    properties: Record<string, GLProperty>,
    transparency: UITransparencyMode = UITransparencyMode.BLEND,
  ): boolean {
    if (this.transparency !== transparency || this.source !== source) {
      return false;
    }

    return arePropertiesPartiallyCompatible(
      { ...this.uniformProperties, ...this.varyingProperties },
      properties,
    );
  }

  public arePropertiesPartiallyCompatible(
    properties: Readonly<Record<string, Readonly<GLProperty>>>,
  ): boolean {
    return arePropertiesPartiallyCompatible(
      { ...this.uniformProperties, ...this.varyingProperties },
      properties,
    );
  }

  public extractInstanceData(handler: number): PlaneData {
    return {
      source: this.source,
      properties: this.extractProperties(handler),
      transparency: this.transparency,
      transform: this.extractTransform(handler),
      visibility: this.extractVisibility(handler),
    };
  }

  public destroy(): void {
    this.instancedGeometry.dispose();
    this.shaderMaterial.dispose();
    this.propertyBuffers.clear();
    this.handlerToIndex.clear();
  }

  private extractProperties(handler: number): Record<string, GLProperty> {
    const index = this.resolveIndex(handler);
    const result: Record<string, GLProperty> = {};

    for (const name in this.uniformProperties) {
      result[name] = this.uniformProperties[name];
    }

    for (const name in this.varyingProperties) {
      const { value, glslTypeInfo } = this.varyingProperties[name];
      const attribute = this.propertyBuffers.get(
        name,
      ) as InstancedBufferAttribute;
      const array = attribute.array as Float32Array;
      const offset = index * attribute.itemSize;
      result[name] = {
        value: reconstructValue(value, array, offset),
        glslTypeInfo,
      };
    }

    return result;
  }

  private extractTransform(handler: number): Matrix4 {
    const index = this.resolveIndex(handler);
    const attribute = this.propertyBuffers.get(
      "instanceTransform",
    ) as InstancedBufferAttribute;
    const array = attribute.array as Float32Array;

    const matrix = new Matrix4();
    matrix.fromArray(array, index * 16);
    return matrix;
  }

  private extractVisibility(handler: number): boolean {
    const index = this.resolveIndex(handler);
    const attribute = this.propertyBuffers.get(
      "instanceVisibility",
    ) as InstancedBufferAttribute;
    const array = attribute.array as Float32Array;
    return array[index] >= 0.5;
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
      throw new Error(
        `UIGenericInstancedPlane.resolveIndex.handler: invalid handler`,
      );
    }
    return index;
  }

  private resolveAttribute(name: string): InstancedBufferAttribute {
    const attribute = this.propertyBuffers.get(name);
    if (attribute === undefined) {
      throw new Error(
        `UIGenericInstancedPlane.resolveAttribute.name: unknown attribute`,
      );
    }
    return attribute;
  }
}

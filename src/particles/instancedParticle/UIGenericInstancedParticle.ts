import type { InstancedBufferGeometry, ShaderMaterial, Vector2 } from "three";
import { InstancedBufferAttribute, Mesh, StreamDrawUsage } from "three";
import {
  resolvePropertyUniform,
  type GLProperty,
  type GLTypeInfo,
} from "../../core/miscellaneous/generic-plane/shared";
import {
  buildMaterial,
  INSTANCED_PARTICLE_PLANE_GEOMETRY,
} from "./UIGenericInstancedParticle.Internal";

export class UIGenericInstancedParticle extends Mesh {
  public readonly propertyBuffers: Record<string, InstancedBufferAttribute> = {};

  private readonly instancedGeometry: InstancedBufferGeometry;
  private readonly shaderMaterial: ShaderMaterial;

  private capacity: number;

  constructor(
    public readonly sources: string[],
    uniforms: Record<string, GLProperty>,
    varyings: Record<string, GLTypeInfo>,
    initialCapacity: number,
    private readonly capacityStep: number,
  ) {
    const uniformProperties: Record<string, GLProperty> = uniforms;

    const instancedGeometry = INSTANCED_PARTICLE_PLANE_GEOMETRY.clone();
    const shaderMaterial = buildMaterial(sources, uniformProperties, varyings);

    super(instancedGeometry, shaderMaterial);

    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
    this.matrixWorldAutoUpdate = false;

    this.instancedGeometry = instancedGeometry;
    this.instancedGeometry.instanceCount = 0;

    this.shaderMaterial = shaderMaterial;
    this.capacity = Math.max(
      Math.ceil(initialCapacity / this.capacityStep) * this.capacityStep,
      this.capacityStep,
    );

    {
      for (const name in varyings) {
        const { bufferSize } = varyings[name];
        const attribute = new InstancedBufferAttribute(
          new Float32Array(this.capacity * bufferSize),
          bufferSize,
        );
        attribute.setUsage(StreamDrawUsage);
        this.instancedGeometry.setAttribute(`a_${name}`, attribute);
        this.propertyBuffers[name] = attribute;
      }
    }

    {
      for (const name in uniformProperties) {
        const { value } = uniformProperties[name];
        const uniform = resolvePropertyUniform(name, this.shaderMaterial);
        uniform.value = value;
      }
      this.shaderMaterial.uniformsNeedUpdate = true;
    }
  }

  public get instanceCount(): number {
    return this.instancedGeometry.instanceCount;
  }

  public createInstances(count: number): void {
    const index = this.instancedGeometry.instanceCount;
    this.ensureCapacity(index + count);
    this.instancedGeometry.instanceCount += count;
  }

  public destroyInstance(index: number): void {
    const lastIndex = this.instancedGeometry.instanceCount - 1;
    if (index < lastIndex) {
      this.moveInstanceData(lastIndex, index);
    }

    this.instancedGeometry.instanceCount--;
  }

  public setOrigin(x: number, y: number): void {
    const uniform = resolvePropertyUniform("origin", this.shaderMaterial);
    (uniform.value as Vector2).set(x, y);
  }

  public removeDeadParticles(): void {
    const lifetimeBuffer = this.propertyBuffers.lifetime as InstancedBufferAttribute | undefined;
    if (lifetimeBuffer === undefined) {
      return;
    }

    const lifetimeArray = lifetimeBuffer.array as Float32Array;
    const itemSize = lifetimeBuffer.itemSize;
    const instanceCount = this.instancedGeometry.instanceCount;

    let writeIndex = 0;

    for (let readIndex = 0; readIndex < instanceCount; readIndex++) {
      const offset = readIndex * itemSize;
      const lifetime = lifetimeArray[offset];
      const age = lifetimeArray[offset + 1];

      const isAlive = age < lifetime;

      if (isAlive) {
        if (writeIndex !== readIndex) {
          for (const name in this.propertyBuffers) {
            const attribute = this.propertyBuffers[name];
            const array = attribute.array as Float32Array;
            const size = attribute.itemSize;

            const srcOffset = readIndex * size;
            const dstOffset = writeIndex * size;

            for (let i = 0; i < size; i++) {
              array[dstOffset + i] = array[srcOffset + i];
            }

            attribute.needsUpdate = true;
          }
        }
        writeIndex++;
      }
    }

    this.instancedGeometry.instanceCount = writeIndex;
  }

  public destroy(): void {
    this.instancedGeometry.dispose();
    this.shaderMaterial.dispose();
  }

  private ensureCapacity(requiredCapacity: number): void {
    if (requiredCapacity <= this.capacity) {
      return;
    }

    const newCapacity = Math.ceil(requiredCapacity / this.capacityStep) * this.capacityStep;

    for (const name in this.propertyBuffers) {
      const oldAttribute = this.propertyBuffers[name];
      const itemSize = oldAttribute.itemSize;
      const newArray = new Float32Array(newCapacity * itemSize);
      newArray.set(oldAttribute.array as Float32Array);

      const newAttribute = new InstancedBufferAttribute(newArray, itemSize);
      newAttribute.setUsage(oldAttribute.usage);
      this.instancedGeometry.setAttribute(`a_${name}`, newAttribute);
      this.propertyBuffers[name] = newAttribute;
    }

    this.capacity = newCapacity;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- old three.js compatibility fix
    (this.instancedGeometry as any)._maxInstanceCount = newCapacity;
  }

  private moveInstanceData(sourceIndex: number, targetIndex: number): void {
    for (const name in this.propertyBuffers) {
      const attribute = this.propertyBuffers[name];
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
}

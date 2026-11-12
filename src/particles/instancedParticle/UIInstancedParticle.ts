import type { InstancedBufferGeometry, ShaderMaterial, Vector2, WebGLRenderer } from "three";
import { InstancedBufferAttribute, Mesh, StreamDrawUsage } from "three";

import {
  assertVaryingBudget,
  assertVertexAttributeBudget,
} from "../../core/miscellaneous/asserts.js";
import type { GLProperty, GLTypeInfo } from "../../core/miscellaneous/generic-plane/shared.js";
import { resolvePropertyUniform } from "../../core/miscellaneous/generic-plane/shared.js";
import { BUILTIN_OFFSET_AGE, BUILTIN_OFFSET_LIFETIME } from "../miscellaneous/miscellaneous.js";
import {
  buildParticleMaterial,
  INSTANCED_PARTICLE_GEOMETRY,
} from "./UIInstancedParticle.Internal.js";

/** Update-range API of InstancedBufferAttribute across the supported three.js versions */
interface UpdateRangeAttribute {
  addUpdateRange?: (start: number, count: number) => void;
  clearUpdateRanges?: () => void;
  updateRange?: { offset: number; count: number };
}

function setUpdateRange(attribute: InstancedBufferAttribute, count: number): void {
  const ranged = attribute as unknown as UpdateRangeAttribute;
  // Newer three.js replaced updateRange with addUpdateRange.
  if (ranged.addUpdateRange !== undefined && ranged.clearUpdateRanges !== undefined) {
    ranged.clearUpdateRanges();
    ranged.addUpdateRange(0, count);
  } else if (ranged.updateRange !== undefined) {
    ranged.updateRange.offset = 0;
    ranged.updateRange.count = count;
  }
}

export class UIInstancedParticle extends Mesh {
  public readonly propertyBuffers: Record<string, InstancedBufferAttribute> = {};

  private readonly instancedGeometry: InstancedBufferGeometry;
  private readonly shaderMaterial: ShaderMaterial;
  private readonly vertexAttributeCount: number;
  private readonly vertexAttributeSubject: string;
  private readonly varyingRowCount: number;
  private capacity: number;

  constructor(
    sources: string[],
    uniforms: Record<string, GLProperty>,
    varyings: Record<string, GLTypeInfo>,
    expectedCapacity: number,
    private readonly capacityStep: number,
  ) {
    const instancedGeometry = INSTANCED_PARTICLE_GEOMETRY.clone();
    const { material: shaderMaterial, varyingRowCount } = buildParticleMaterial(
      sources,
      uniforms,
      varyings,
    );

    super(instancedGeometry, shaderMaterial);

    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
    this.matrixWorldAutoUpdate = false;

    this.instancedGeometry = instancedGeometry;
    this.instancedGeometry.instanceCount = 0;

    this.shaderMaterial = shaderMaterial;
    this.capacity = Math.max(
      Math.ceil(expectedCapacity / this.capacityStep) * this.capacityStep,
      this.capacityStep,
    );

    let vertexAttributeCount = Object.keys(INSTANCED_PARTICLE_GEOMETRY.attributes).length;
    for (const name in varyings) {
      vertexAttributeCount += varyings[name].columnCount;
    }
    this.vertexAttributeCount = vertexAttributeCount;
    this.vertexAttributeSubject = `UIInstancedParticle.onBeforeRender.properties (${Object.keys(
      varyings,
    ).join(", ")})`;
    this.varyingRowCount = varyingRowCount;
    this.onBeforeRender = this.onBeforeRenderInternal;

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

  public get instanceCount(): number {
    return this.instancedGeometry.instanceCount;
  }

  public createInstances(count: number): void {
    const currentInstanceCount = this.instancedGeometry.instanceCount;
    this.ensureCapacity(currentInstanceCount + count);
    this.instancedGeometry.instanceCount += count;
  }

  /** Zeroes every property of the instances in [instanceBegin, instanceEnd) */
  public resetInstances(instanceBegin: number, instanceEnd: number): void {
    for (const name in this.propertyBuffers) {
      const attribute = this.propertyBuffers[name];
      const { array, itemSize } = attribute;
      array.fill(0, instanceBegin * itemSize, instanceEnd * itemSize);
      attribute.needsUpdate = true;
    }
  }

  /**
   * Limits the next upload of each marked buffer to the live instances. Call only with live
   * instances: an empty range uploads the whole buffer.
   */
  public limitUploadToLiveInstances(): void {
    const { instanceCount } = this.instancedGeometry;
    for (const name in this.propertyBuffers) {
      const attribute = this.propertyBuffers[name];
      setUpdateRange(attribute, instanceCount * attribute.itemSize);
    }
  }

  public setOrigin(x: number, y: number): void {
    const uniform = resolvePropertyUniform("origin", this.shaderMaterial);
    (uniform.value as Vector2).set(x, y);
  }

  public removeDeadParticles(): void {
    const builtinBuffer = this.propertyBuffers.builtin as InstancedBufferAttribute | undefined;
    if (builtinBuffer === undefined) {
      return;
    }

    const { array: builtinArray, itemSize: builtinItemSize } = builtinBuffer;
    const { instanceCount } = this.instancedGeometry;

    let writeIndex = 0;

    for (let readIndex = 0; readIndex < instanceCount; readIndex++) {
      const offset = readIndex * builtinItemSize;

      if (
        builtinArray[offset + BUILTIN_OFFSET_AGE] < builtinArray[offset + BUILTIN_OFFSET_LIFETIME]
      ) {
        if (writeIndex !== readIndex) {
          for (const name in this.propertyBuffers) {
            const attribute = this.propertyBuffers[name];
            const { itemSize: dataItemSize, array: dataArray } = attribute;

            const srcOffset = readIndex * dataItemSize;
            const dstOffset = writeIndex * dataItemSize;

            dataArray.copyWithin(dstOffset, srcOffset, srcOffset + dataItemSize);
            attribute.needsUpdate = true;
          }
        }

        writeIndex++;
      }
    }

    this.instancedGeometry.instanceCount = writeIndex;
  }

  public drop(): void {
    this.instancedGeometry.instanceCount = 0;
  }

  public destroy(): void {
    this.instancedGeometry.dispose();
    this.shaderMaterial.dispose();
  }

  private ensureCapacity(requiredCapacity: number): void {
    if (requiredCapacity <= this.capacity) {
      return;
    }

    const newCapacity =
      Math.ceil(Math.max(this.capacity * 2, requiredCapacity) / this.capacityStep) *
      this.capacityStep;

    // Frees the GPU buffers of the replaced attributes; the renderer uploads the new ones.
    this.instancedGeometry.dispose();

    for (const name in this.propertyBuffers) {
      const { itemSize, array, usage } = this.propertyBuffers[name];
      const newArray = new Float32Array(newCapacity * itemSize);
      newArray.set(array);

      const newAttribute = new InstancedBufferAttribute(newArray, itemSize);
      newAttribute.setUsage(usage);
      this.instancedGeometry.setAttribute(`a_${name}`, newAttribute);
      this.propertyBuffers[name] = newAttribute;
    }

    this.capacity = newCapacity;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- old three.js compatibility fix
    (this.instancedGeometry as any)._maxInstanceCount = newCapacity;
  }

  private readonly onBeforeRenderInternal = (renderer: WebGLRenderer): void => {
    assertVertexAttributeBudget(renderer, this.vertexAttributeCount, this.vertexAttributeSubject);
    assertVaryingBudget(renderer, this.varyingRowCount, this.vertexAttributeSubject);
  };
}

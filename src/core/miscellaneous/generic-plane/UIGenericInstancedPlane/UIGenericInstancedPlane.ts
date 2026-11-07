import type {
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix4,
  ShaderMaterial,
  WebGLRenderer,
} from "three";
import { Mesh } from "three";
import { assertVaryingBudget, assertVertexAttributeBudget } from "../../asserts.js";
import {
  MASK_DATA_MODE_OFFSET,
  MASK_DATA_ROW0_OFFSET,
  MASK_DATA_ROW1_OFFSET,
  MASK_DATA_SHAPE_OFFSET,
} from "../../mask/UIMask.Internal.js";
import type { UITransparencyMode } from "../../UITransparencyMode.js";
import type { GLProperty, HSLAdjustment } from "../shared.js";
import {
  arePropertiesPartiallyCompatible,
  cloneGLProperties,
  resolvePropertyUniform,
  TRANSFORM_ZINDEX_OFFSET,
} from "../shared.js";
import {
  BUILTIN_BLEND,
  BUILTIN_HSL,
  BUILTIN_MASK_MODE,
  BUILTIN_MASK_ROW0,
  BUILTIN_MASK_ROW1,
  BUILTIN_MASK_SHAPE,
  BUILTIN_TRANSFORM,
  BUILTIN_VISIBILITY,
  buildMaterial,
  buildPackedAttribute,
  buildPlaneLayout,
  CAPACITY_STEP,
  copyBetweenBuffers,
  INITIAL_CAPACITY,
  INSTANCED_PLANE_GEOMETRY,
  shiftBufferRegion,
  writePropertyToArray,
} from "./UIGenericInstancedPlane.Internal.js";
import type { PackedField, PackedLayout } from "./UIGenericInstancedPlane.Layout.js";
import { packedAttributeName, resolvePackedField } from "./UIGenericInstancedPlane.Layout.js";

const TEMP_FIELD_VALUES = new Float32Array(16);

/**
 * Instanced shader plane mesh for batched rendering.
 *
 * Operates on indices, not handlers. Registry manages handler->index mapping.
 * Elements are ordered by zIndex (ascending) within the buffer.
 *
 * Per-instance data (the builtin transform, visibility, blend and HSL plus every instantiable
 * property) is packed into as few vertex attributes as possible, see
 * UIGenericInstancedPlane.Layout.ts. The zIndex is read back from the packed transform.
 *
 * A masked plane is a separate shader variant with the builtin mask fields added; unmasked
 * planes pay nothing for masking. See UIMask.Internal.ts for the mask data.
 *
 * @internal
 */
export class UIGenericInstancedPlane extends Mesh {
  public readonly source: string;
  public readonly transparency: UITransparencyMode;
  public readonly masked: boolean;

  private readonly instancedGeometry: InstancedBufferGeometry;
  private readonly shaderMaterial: ShaderMaterial;
  private readonly properties: Record<string, GLProperty>;
  private readonly uniformProperties: Record<string, GLProperty>;
  private readonly layout: PackedLayout;
  private readonly packedAttributes: InstancedBufferAttribute[];

  private readonly transformField: PackedField;
  private readonly visibilityField: PackedField;
  private readonly blendField: PackedField;
  private readonly hslField: PackedField;
  private readonly maskFields: readonly PackedField[] | undefined;

  private readonly zIndexAttributeIndex: number;
  private readonly zIndexComponentOffset: number;

  private readonly vertexAttributeCount: number;
  private readonly vertexAttributeSubject: string;
  private readonly varyingRowCount: number;

  private capacity: number;
  private instancesCountInternal: number;

  constructor(
    source: string,
    properties: Record<string, GLProperty>,
    transparency: UITransparencyMode,
    masked: boolean,
    initialCapacity: number = INITIAL_CAPACITY,
  ) {
    const uniformProperties: Record<string, GLProperty> = {};
    const varyingProperties: Record<string, GLProperty> = {};

    for (const name in properties) {
      const descriptor = properties[name];
      if (descriptor.glslTypeInfo.instantiable) {
        varyingProperties[name] = descriptor;
      } else {
        uniformProperties[name] = descriptor;
      }
    }

    const layout = buildPlaneLayout(varyingProperties, masked);
    const instancedGeometry = INSTANCED_PLANE_GEOMETRY.clone();
    const { material: shaderMaterial, varyingRowCount } = buildMaterial(
      source,
      uniformProperties,
      layout,
      transparency,
      masked,
    );

    super(instancedGeometry, shaderMaterial);

    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
    this.matrixWorldAutoUpdate = false;

    this.source = source;
    this.transparency = transparency;
    this.masked = masked;
    this.instancedGeometry = instancedGeometry;
    this.shaderMaterial = shaderMaterial;
    this.properties = properties;
    this.uniformProperties = uniformProperties;
    this.layout = layout;
    this.packedAttributes = [];

    this.transformField = resolvePackedField(layout, BUILTIN_TRANSFORM);
    this.visibilityField = resolvePackedField(layout, BUILTIN_VISIBILITY);
    this.blendField = resolvePackedField(layout, BUILTIN_BLEND);
    this.hslField = resolvePackedField(layout, BUILTIN_HSL);
    // Same order as the mask data: row 0, row 1, shape, mode
    this.maskFields = masked
      ? [
          resolvePackedField(layout, BUILTIN_MASK_ROW0),
          resolvePackedField(layout, BUILTIN_MASK_ROW1),
          resolvePackedField(layout, BUILTIN_MASK_SHAPE),
          resolvePackedField(layout, BUILTIN_MASK_MODE),
        ]
      : undefined;

    const zIndexColumn = this.transformField.columns.find(
      ({ sourceOffset, size }) =>
        sourceOffset <= TRANSFORM_ZINDEX_OFFSET && TRANSFORM_ZINDEX_OFFSET < sourceOffset + size,
    );
    if (zIndexColumn === undefined) {
      throw new Error(`UIGenericInstancedPlane.constructor: transform layout lacks the zIndex`);
    }
    this.zIndexAttributeIndex = zIndexColumn.attributeIndex;
    this.zIndexComponentOffset =
      zIndexColumn.componentOffset + TRANSFORM_ZINDEX_OFFSET - zIndexColumn.sourceOffset;

    this.vertexAttributeCount =
      Object.keys(INSTANCED_PLANE_GEOMETRY.attributes).length + layout.attributeSizes.length;
    this.vertexAttributeSubject = `UIGenericInstancedPlane.onBeforeRender.properties (${Object.keys(
      varyingProperties,
    ).join(", ")})`;
    this.varyingRowCount = varyingRowCount;
    this.onBeforeRender = this.onBeforeRenderInternal;

    this.capacity = Math.max(
      Math.ceil(initialCapacity / CAPACITY_STEP) * CAPACITY_STEP,
      CAPACITY_STEP,
    );
    this.instancesCountInternal = 0;
    this.instancedGeometry.instanceCount = 0;

    for (let i = 0; i < layout.attributeSizes.length; i++) {
      const attribute = buildPackedAttribute(layout.attributeSizes[i], this.capacity);
      this.instancedGeometry.setAttribute(packedAttributeName(i), attribute);
      this.packedAttributes.push(attribute);
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
    blend: number,
    hsl: HSLAdjustment,
    mask: Readonly<Float32Array> | null,
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

    this.writeField(index, this.transformField, transform.elements);
    this.writeVisibility(index, visibility);
    this.writeBlend(index, blend);
    this.writeHSL(index, hsl);
    this.writeProperties(index, properties);
    if (mask !== null) {
      this.writeMask(index, mask);
    }

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
  public setPropertiesAt(index: number, properties: Record<string, GLProperty>): void {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.setPropertiesAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    this.writeProperties(index, properties);
  }

  /** Update transform at given index */
  public setTransformAt(index: number, transform: Matrix4): void {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.setTransformAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    this.writeField(index, this.transformField, transform.elements);
  }

  /** Update visibility at given index */
  public setVisibilityAt(index: number, visible: boolean): void {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.setVisibilityAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    this.writeVisibility(index, visible);
  }

  /** Update blend factor at given index (1 = normal over, 0 = additive) */
  public setBlendAt(index: number, blend: number): void {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.setBlendAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    this.writeBlend(index, blend);
  }

  /** Update HSL adjustment at given index (hue in turns, saturation multiplier, lightness offset) */
  public setHSLAt(index: number, hsl: HSLAdjustment): void {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.setHSLAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    this.writeHSL(index, hsl);
  }

  /** Update mask data at given index; the plane must be masked */
  public setMaskAt(index: number, mask: Readonly<Float32Array>): void {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.setMaskAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    this.writeMask(index, mask);
  }

  /** Get zIndex at given index (from transform buffer) */
  public getZIndexAt(index: number): number {
    if (index < 0 || index >= this.instancesCountInternal) {
      throw new Error(
        `UIGenericInstancedPlane.getZIndexAt.index: out of bounds (index=${index}, count=${this.instancesCountInternal})`,
      );
    }

    const attribute = this.packedAttributes[this.zIndexAttributeIndex];
    return (attribute.array as Float32Array)[
      index * attribute.itemSize + this.zIndexComponentOffset
    ];
  }

  /**
   * Merge another instanced plane into this one (append).
   * Other plane becomes empty after merge.
   */
  public merge(other: UIGenericInstancedPlane): void {
    if (other.layout.signature !== this.layout.signature) {
      throw new Error(`UIGenericInstancedPlane.merge.other: incompatible attribute layout`);
    }

    if (other.instancesCountInternal === 0) {
      return;
    }

    this.ensureCapacity(this.instancesCountInternal + other.instancesCountInternal);

    for (let i = 0; i < this.packedAttributes.length; i++) {
      const thisAttribute = this.packedAttributes[i];
      const itemSize = thisAttribute.itemSize;

      copyBetweenBuffers(
        other.packedAttributes[i].array as Float32Array,
        0,
        thisAttribute.array as Float32Array,
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
      cloneGLProperties(this.properties),
      this.transparency,
      this.masked,
      tailCount,
    );

    for (let i = 0; i < this.packedAttributes.length; i++) {
      const thisAttribute = this.packedAttributes[i];
      const newAttribute = newPlane.packedAttributes[i];
      const itemSize = thisAttribute.itemSize;

      copyBetweenBuffers(
        thisAttribute.array as Float32Array,
        atIndex * itemSize,
        newAttribute.array as Float32Array,
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
    masked: boolean,
  ): boolean {
    return (
      this.source === source &&
      this.transparency === transparency &&
      this.masked === masked &&
      arePropertiesPartiallyCompatible(this.properties, properties)
    );
  }

  /**
   * Check if another plane can be merged into this one: same shader source, transparency and
   * mask variant, same attribute layout and the same uniform values.
   */
  public canMerge(other: UIGenericInstancedPlane): boolean {
    return (
      this.source === other.source &&
      this.transparency === other.transparency &&
      this.masked === other.masked &&
      this.layout.signature === other.layout.signature &&
      arePropertiesPartiallyCompatible(this.uniformProperties, other.uniformProperties) &&
      arePropertiesPartiallyCompatible(other.uniformProperties, this.uniformProperties)
    );
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
    this.packedAttributes.length = 0;
  }

  private ensureCapacity(requiredCapacity: number): void {
    if (requiredCapacity <= this.capacity) {
      return;
    }

    const newCapacity = Math.ceil(requiredCapacity / CAPACITY_STEP) * CAPACITY_STEP;

    for (let i = 0; i < this.packedAttributes.length; i++) {
      const oldAttribute = this.packedAttributes[i];
      const newAttribute = buildPackedAttribute(oldAttribute.itemSize, newCapacity);
      (newAttribute.array as Float32Array).set(oldAttribute.array);

      this.instancedGeometry.setAttribute(packedAttributeName(i), newAttribute);
      this.packedAttributes[i] = newAttribute;
    }

    this.capacity = newCapacity;
    // three.js caches the drawable instance count from the attribute sizes on the first render and
    // only resets it on dispose; without this a grown plane keeps drawing the old capacity
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- private three.js field
    (this.instancedGeometry as any)._maxInstanceCount = newCapacity;
  }

  private shiftBuffersRight(fromIndex: number, delta: number): void {
    const elementsToMove = this.instancesCountInternal - fromIndex;
    if (elementsToMove <= 0) {
      return;
    }

    for (const attribute of this.packedAttributes) {
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

    for (const attribute of this.packedAttributes) {
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

  private writeProperties(index: number, properties: Record<string, GLProperty>): void {
    for (const name in properties) {
      const { value, glslTypeInfo } = properties[name];

      if (glslTypeInfo.instantiable) {
        // The layout of the plane decides, so a plain Matrix3 fits an affine field too
        const affine = this.properties[name].glslTypeInfo.affine === true;
        writePropertyToArray(value, TEMP_FIELD_VALUES, 0, affine);
        this.writeField(index, resolvePackedField(this.layout, name), TEMP_FIELD_VALUES);
      } else {
        const uniform = resolvePropertyUniform(name, this.shaderMaterial);
        uniform.value = value;
        this.shaderMaterial.uniformsNeedUpdate = true;
      }
    }
  }

  private writeVisibility(index: number, visibility: boolean): void {
    TEMP_FIELD_VALUES[0] = visibility ? 1 : 0;
    this.writeField(index, this.visibilityField, TEMP_FIELD_VALUES);
  }

  private writeBlend(index: number, blend: number): void {
    TEMP_FIELD_VALUES[0] = blend;
    this.writeField(index, this.blendField, TEMP_FIELD_VALUES);
  }

  private writeHSL(index: number, hsl: HSLAdjustment): void {
    TEMP_FIELD_VALUES[0] = hsl.h;
    TEMP_FIELD_VALUES[1] = hsl.s;
    TEMP_FIELD_VALUES[2] = hsl.l;
    this.writeField(index, this.hslField, TEMP_FIELD_VALUES);
  }

  private writeMask(index: number, mask: Readonly<Float32Array>): void {
    if (this.maskFields === undefined) {
      throw new Error(`UIGenericInstancedPlane.writeMask: plane is not masked`);
    }
    const [row0Field, row1Field, shapeField, modeField] = this.maskFields;
    this.writeField(index, row0Field, mask.subarray(MASK_DATA_ROW0_OFFSET));
    this.writeField(index, row1Field, mask.subarray(MASK_DATA_ROW1_OFFSET));
    this.writeField(index, shapeField, mask.subarray(MASK_DATA_SHAPE_OFFSET));
    this.writeField(index, modeField, mask.subarray(MASK_DATA_MODE_OFFSET));
  }

  private writeField(index: number, field: PackedField, values: ArrayLike<number>): void {
    for (const { attributeIndex, componentOffset, sourceOffset, size } of field.columns) {
      const attribute = this.packedAttributes[attributeIndex];
      const array = attribute.array as Float32Array;
      const offset = index * attribute.itemSize + componentOffset;

      for (let i = 0; i < size; i++) {
        array[offset + i] = values[sourceOffset + i];
      }
      attribute.needsUpdate = true;
    }
  }

  private readonly onBeforeRenderInternal = (renderer: WebGLRenderer): void => {
    assertVertexAttributeBudget(renderer, this.vertexAttributeCount, this.vertexAttributeSubject);
    assertVaryingBudget(renderer, this.varyingRowCount, this.vertexAttributeSubject);
  };
}

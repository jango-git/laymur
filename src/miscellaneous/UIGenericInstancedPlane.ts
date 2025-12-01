import type { IUniform } from "three";
import {
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix2,
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
  | Matrix2
  | Matrix3
  | Matrix4
  | number;

export type UIPropertyTypeName =
  | "Texture"
  | "UIColor"
  | "Vector2"
  | "Vector3"
  | "Vector4"
  | "Matrix2"
  | "Matrix3"
  | "Matrix4"
  | "number";

interface Descriptor {
  firstIndex: number;
  count: number;
}

const INSTANCED_GEOMETRY = ((): InstancedBufferGeometry => {
  const planeGeometry = new PlaneGeometry(1, 1);
  const geometry = new InstancedBufferGeometry();
  geometry.index = planeGeometry.index;
  geometry.setAttribute("position", planeGeometry.attributes["position"]);
  geometry.setAttribute("uv", planeGeometry.attributes["uv"]);
  planeGeometry.dispose();
  return geometry;
})();

const ITEM_1_OFFSET = 1;
const ITEM_2_OFFSET = 2;
const ITEM_3_OFFSET = 3;

const CAPACITY_STEP = 16;
const ALPHA_TEST = 0.5;

function resolveTypeInfo(property: UIPropertyType | UIPropertyTypeName): {
  instantiable: boolean;
  glslType: string;
  itemSize: number;
} {
  if (property === "Texture" || property instanceof Texture) {
    return { glslType: "sampler2D", instantiable: false, itemSize: -1 };
  } else if (property === "UIColor" || property instanceof UIColor) {
    return { glslType: "vec4", instantiable: true, itemSize: 4 };
  } else if (property === "Vector2" || property instanceof Vector2) {
    return { glslType: "vec2", instantiable: true, itemSize: 2 };
  } else if (property === "Vector3" || property instanceof Vector3) {
    return { glslType: "vec3", instantiable: true, itemSize: 3 };
  } else if (property === "Vector4" || property instanceof Vector4) {
    return { glslType: "vec4", instantiable: true, itemSize: 4 };
  } else if (property === "Matrix2" || property instanceof Matrix2) {
    return { glslType: "mat2", instantiable: true, itemSize: 4 };
  } else if (property === "Matrix3" || property instanceof Matrix3) {
    return { glslType: "mat3", instantiable: true, itemSize: 9 };
  } else if (property === "Matrix4" || property instanceof Matrix4) {
    return { glslType: "mat4", instantiable: true, itemSize: 16 };
  } else if (property === "number" || typeof property === "number") {
    return { glslType: "float", instantiable: true, itemSize: 1 };
  } else {
    throw new Error(`Unsupported property type: ${property}`);
  }
}

function udpateProperty(
  value: UIPropertyType,
  attribute: InstancedBufferAttribute,
  itemOffset: number,
): void {
  const array = attribute.array as Float32Array;

  if (value instanceof UIColor) {
    array[itemOffset] = value.r;
    array[itemOffset + ITEM_1_OFFSET] = value.g;
    array[itemOffset + ITEM_2_OFFSET] = value.b;
    array[itemOffset + ITEM_3_OFFSET] = value.a;
  } else if (value instanceof Vector2) {
    array[itemOffset] = value.x;
    array[itemOffset + ITEM_1_OFFSET] = value.y;
  } else if (value instanceof Vector3) {
    array[itemOffset] = value.x;
    array[itemOffset + ITEM_1_OFFSET] = value.y;
    array[itemOffset + ITEM_2_OFFSET] = value.z;
  } else if (value instanceof Vector4) {
    array[itemOffset] = value.x;
    array[itemOffset + ITEM_1_OFFSET] = value.y;
    array[itemOffset + ITEM_2_OFFSET] = value.z;
    array[itemOffset + ITEM_3_OFFSET] = value.w;
  } else if (value instanceof Matrix2) {
    const elements = value.elements;
    for (let j = 0; j < elements.length; j++) {
      array[itemOffset + j] = elements[j];
    }
  } else if (value instanceof Matrix3) {
    const elements = value.elements;
    for (let j = 0; j < elements.length; j++) {
      array[itemOffset + j] = elements[j];
    }
  } else if (value instanceof Matrix4) {
    const elements = value.elements;
    for (let j = 0; j < elements.length; j++) {
      array[itemOffset + j] = elements[j];
    }
  } else if (typeof value === "number") {
    array[itemOffset] = value;
  }

  attribute.needsUpdate = true;
}

function buildEmptyInstancedBufferAttribute(
  property: UIPropertyType | UIPropertyTypeName,
  capacity: number,
): InstancedBufferAttribute {
  const info = resolveTypeInfo(property);
  if (!info.instantiable) {
    throw new Error(`Invalid property type: ${property}`);
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
    const glslType = resolveTypeInfo(propertyTypeName).glslType;
    uniforms[`u_${name}`] = { value: null };
    uniformDeclarations.push(`uniform ${glslType} u_${name};`);
  }

  for (const [name, propertyTypeName] of Object.entries(varyingLayout)) {
    const glslType = resolveTypeInfo(propertyTypeName).glslType;
    attributeDeclarations.push(`attribute ${glslType} a_${name};`);
    varyingDeclarations.push(`varying ${glslType} v_${name};`);
    vertexAssignments.push(`v_${name} = a_${name};`);
  }

  const vertexShader = `
    ${attributeDeclarations.join("\n")}

    ${uniformDeclarations.join("\n")}

    ${varyingDeclarations.join("\n")}
    varying vec3 v_position;
    varying vec2 v_uv;

    void main() {
      if (a_visibility < 0.5) {
        gl_Position = vec4(2.0, 2.0, 2.0, 2.0);
        return;
      }

      ${vertexAssignments.join("\n")}

      v_position = position;
      v_uv = (a_uvTransform * vec3(uv, 1.0)).xy;

      gl_Position = projectionMatrix * modelViewMatrix * a_instanceTransform * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    ${uniformDeclarations.join("\n")}

    ${varyingDeclarations.join("\n")}
    varying vec3 v_position;
    varying vec2 v_uv;

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
    alphaTest: transparency === UITransparencyMode.CLIP ? ALPHA_TEST : 0.0,
    alphaHash: transparency === UITransparencyMode.HASH,
  });
}

export class UIGenericInstancedPlane extends Mesh {
  protected handlerToDescriptor: Map<number, Descriptor> = new Map();

  protected lastHandler = 0;
  protected capacity = 0;
  protected propertyBuffers: Map<string, InstancedBufferAttribute> = new Map();

  private readonly instancedGeometry: InstancedBufferGeometry;
  private readonly shaderMaterial: ShaderMaterial;

  constructor(
    source: string,
    layout: Record<string, UIPropertyTypeName>,
    transparency: UITransparencyMode = UITransparencyMode.CLIP,
    capacity: number = CAPACITY_STEP,
  ) {
    const uniformLayout: Record<string, UIPropertyTypeName> = {};
    const varyingLayout: Record<string, UIPropertyTypeName> = {
      instanceTransform: "Matrix4",
      uvTransform: "Matrix3",
      ...(transparency === UITransparencyMode.CLIP
        ? { alphaTest: "number" }
        : {}),
    };

    for (const [name, propertyTypeName] of Object.entries(layout)) {
      (resolveTypeInfo(propertyTypeName).instantiable
        ? varyingLayout
        : uniformLayout)[name] = propertyTypeName;
    }

    const instancedGeometry = INSTANCED_GEOMETRY.clone();
    const shaderMaterial = buildMaterial(
      source,
      uniformLayout,
      varyingLayout,
      transparency,
    );

    super(instancedGeometry, shaderMaterial);

    this.instancedGeometry = instancedGeometry;
    this.instancedGeometry.instanceCount = 0;

    this.shaderMaterial = shaderMaterial;
    this.capacity = Math.max(capacity, CAPACITY_STEP);

    for (const [name, propertyTypeName] of Object.entries(varyingLayout)) {
      const attribute = buildEmptyInstancedBufferAttribute(
        propertyTypeName,
        this.capacity,
      );

      this.instancedGeometry.setAttribute(`a_${name}`, attribute);
      this.propertyBuffers.set(`a_${name}`, attribute);
    }
  }

  public createInstances(count: number): number {
    const handler = this.lastHandler++;

    if (this.instancedGeometry.instanceCount + count > this.capacity) {
      this.resizeGeometry(
        Math.ceil((this.capacity + count) / CAPACITY_STEP) * CAPACITY_STEP,
      );
    }

    this.handlerToDescriptor.set(handler, {
      firstIndex: this.instancedGeometry.instanceCount,
      count,
    });

    this.instancedGeometry.instanceCount += count;
    return handler;
  }

  public destroyInstances(handler: number): void {
    const releasedDescriptor = this.handlerToDescriptor.get(handler);
    if (releasedDescriptor === undefined) {
      throw new Error(`No range found for userIndex: ${handler}`);
    }

    this.handlerToDescriptor.delete(handler);

    const values = Array.from(this.handlerToDescriptor.values());
    const edge = releasedDescriptor.firstIndex + releasedDescriptor.count;
    let replacementDescriptor: Descriptor | undefined;

    for (let i = values.length - 1; i > edge; i--) {
      const descriptor = values[i];
      if (descriptor.count === releasedDescriptor.count) {
        replacementDescriptor = descriptor;
        break;
      }
    }

    if (replacementDescriptor) {
      this.copyRangeData(replacementDescriptor, releasedDescriptor);
      replacementDescriptor.firstIndex = releasedDescriptor.firstIndex;

      this.shiftRangesDown(
        replacementDescriptor.firstIndex + replacementDescriptor.count,
        replacementDescriptor.count,
      );
    } else {
      this.shiftRangesDown(
        releasedDescriptor.firstIndex + releasedDescriptor.count,
        releasedDescriptor.count,
      );
    }

    this.instancedGeometry.instanceCount -= releasedDescriptor.count;
  }

  public updateProperties(
    handler: number,
    offset: number,
    instancesProperties: Record<string, UIPropertyType>[],
  ): void {
    assertValidNonNegativeNumber(
      offset,
      "UIGenericInstancedPlane updateProperties offset",
    );

    const descriptor = this.resolveDescriptor(handler);

    if (instancesProperties.length + offset > descriptor.count) {
      throw new Error(
        `Too many instances for handler: ${handler}, offset: ${offset}, and count: ${instancesProperties.length}`,
      );
    }

    for (let i = 0; i < instancesProperties.length; i++) {
      const instanceProperties = instancesProperties[i];
      const instanceOffset = descriptor.firstIndex + offset + i;

      for (const [name, value] of Object.entries(instanceProperties)) {
        if (resolveTypeInfo(value).instantiable) {
          const attribute = this.resolveBufferAttribute(name);
          const itemOffset = instanceOffset * attribute.itemSize;
          udpateProperty(value, attribute, itemOffset);
        } else {
          const uniform = this.resolveUniform(name);
          uniform.value = value;
          this.shaderMaterial.uniformsNeedUpdate = true;
        }
      }
    }
  }

  public updateTransforms(
    handler: number,
    offset: number,
    instancesTransforms: Matrix4[],
  ): void {
    assertValidNonNegativeNumber(
      offset,
      "UIGenericInstancedPlane updateTransforms offset",
    );

    const descriptor = this.resolveDescriptor(handler);

    if (instancesTransforms.length + offset > descriptor.count) {
      throw new Error(
        `Too many instances for handler: ${handler}, offset: ${offset}, and count: ${instancesTransforms.length}`,
      );
    }

    for (let i = 0; i < instancesTransforms.length; i++) {
      const attribute = this.resolveBufferAttribute("instanceTransform");
      const instanceOffset = descriptor.firstIndex + offset + i;

      const array = attribute.array as Float32Array;
      const itemOffset = instanceOffset * attribute.itemSize;
      const elements = instancesTransforms[i].elements;
      for (let j = 0; j < elements.length; j++) {
        array[itemOffset + j] = elements[j];
      }
      attribute.needsUpdate = true;
    }
  }

  public updateUVTransforms(
    handler: number,
    offset: number,
    uvTransforms: Matrix3[],
  ): void {
    assertValidNonNegativeNumber(
      offset,
      "UIGenericInstancedPlane updateUVTransforms offset",
    );

    const descriptor = this.resolveDescriptor(handler);

    if (uvTransforms.length + offset > descriptor.count) {
      throw new Error(
        `Too many instances for handler: ${handler}, offset: ${offset}, and count: ${uvTransforms.length}`,
      );
    }

    for (let i = 0; i < uvTransforms.length; i++) {
      const attribute = this.resolveBufferAttribute("uvTransform");
      const instanceOffset = descriptor.firstIndex + offset + i;

      const array = attribute.array as Float32Array;
      const itemOffset = instanceOffset * attribute.itemSize;
      const elements = uvTransforms[i].elements;
      for (let j = 0; j < elements.length; j++) {
        array[itemOffset + j] = elements[j];
      }
      attribute.needsUpdate = true;
    }
  }

  public updateVisibility(
    handler: number,
    offset: number,
    instancesVisibility: boolean[],
  ): void {
    assertValidNonNegativeNumber(
      offset,
      "UIGenericInstancedPlane updateVisibility offset",
    );

    const descriptor = this.resolveDescriptor(handler);

    if (instancesVisibility.length + offset > descriptor.count) {
      throw new Error(
        `Too many instances for handler: ${handler}, offset: ${offset}, and count: ${instancesVisibility.length}`,
      );
    }

    for (let i = 0; i < instancesVisibility.length; i++) {
      const attribute = this.resolveBufferAttribute("visibility");
      const instanceOffset = descriptor.firstIndex + offset + i;

      const array = attribute.array as Float32Array;
      const itemOffset = instanceOffset * attribute.itemSize;
      array[itemOffset] = instancesVisibility[i] ? 1 : 0;
      attribute.needsUpdate = true;
    }
  }

  public destroy(): void {
    this.instancedGeometry.dispose();
    this.shaderMaterial.dispose();
  }

  private resolveDescriptor(handler: number): Descriptor {
    const descriptor = this.handlerToDescriptor.get(handler);
    if (descriptor === undefined) {
      throw new Error(`No active range found for handler: ${handler}`);
    }
    return descriptor;
  }

  private resolveBufferAttribute(name: string): InstancedBufferAttribute {
    const attribute = this.propertyBuffers.get(`a_${name}`);
    if (attribute === undefined) {
      throw new Error(`No attribute found for property: ${name} (a_${name})`);
    }
    return attribute;
  }

  private resolveUniform(name: string): IUniform<unknown> {
    const uniform = this.shaderMaterial.uniforms[`u_${name}`] as
      | IUniform<unknown>
      | undefined;

    if (uniform === undefined) {
      throw new Error(`No uniform found for handler: ${name}`);
    }
    return uniform;
  }

  private resizeGeometry(newCapacity: number): void {
    for (const [name, oldAttribute] of this.propertyBuffers.entries()) {
      const itemSize = oldAttribute.itemSize;
      const newArray = new Float32Array(newCapacity * itemSize);

      newArray.set(oldAttribute.array as Float32Array);
      const newAttribute = new InstancedBufferAttribute(newArray, itemSize);

      this.instancedGeometry.setAttribute(`a_${name}`, newAttribute);
      this.propertyBuffers.set(`a_${name}`, newAttribute);
    }

    this.capacity = newCapacity;
  }

  private copyRangeData(
    sourceRange: Descriptor,
    targetRange: Descriptor,
  ): void {
    for (const attribute of this.propertyBuffers.values()) {
      const array = attribute.array as Float32Array;
      const itemSize = attribute.itemSize;

      const sourceStart = sourceRange.firstIndex * itemSize;
      const targetStart = targetRange.firstIndex * itemSize;
      const dataLength = sourceRange.count * itemSize;

      for (let i = 0; i < dataLength; i++) {
        array[targetStart + i] = array[sourceStart + i];
      }

      attribute.needsUpdate = true;
    }
  }

  private shiftRangesDown(startIndex: number, shiftAmount: number): void {
    for (const descriptor of this.handlerToDescriptor.values()) {
      if (descriptor.firstIndex >= startIndex) {
        descriptor.firstIndex -= shiftAmount;
      }
    }

    for (const attribute of this.propertyBuffers.values()) {
      const array = attribute.array as Float32Array;
      const itemSize = attribute.itemSize;

      const startByteIndex = startIndex * itemSize;
      const endByteIndex = this.instancedGeometry.instanceCount * itemSize;
      const shiftByteAmount = shiftAmount * itemSize;

      for (let i = startByteIndex; i < endByteIndex - shiftByteAmount; i++) {
        array[i] = array[i + shiftByteAmount];
      }

      attribute.needsUpdate = true;
    }
  }
}

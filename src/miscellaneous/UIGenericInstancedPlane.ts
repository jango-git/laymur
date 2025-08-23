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

interface RangeDescriptor {
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
  protected userIndexToRangeDescriptor: Map<number, RangeDescriptor> =
    new Map();

  protected nextUserIndex = 0;
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
      this.propertyBuffers.set(name, attribute);
    }
  }

  public allocateInstances(count: number): number {
    const userIndex = this.nextUserIndex++;

    if (this.instancedGeometry.instanceCount + count > this.capacity) {
      this.resizeGeometry(
        Math.ceil((this.capacity + count) / CAPACITY_STEP) * CAPACITY_STEP,
      );
    }

    this.userIndexToRangeDescriptor.set(userIndex, {
      firstIndex: this.instancedGeometry.instanceCount,
      count,
    });

    this.instancedGeometry.instanceCount += count;
    return userIndex;
  }

  public releaseInstances(userIndex: number): void {
    const releasedDescriptor = this.userIndexToRangeDescriptor.get(userIndex);
    if (releasedDescriptor === undefined) {
      throw new Error(`No range found for userIndex: ${userIndex}`);
    }

    this.userIndexToRangeDescriptor.delete(userIndex);

    const values = Array.from(this.userIndexToRangeDescriptor.values());
    const edge = releasedDescriptor.firstIndex + releasedDescriptor.count;
    let replacementDescriptor: RangeDescriptor | undefined;

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

  public updateInstances(
    userIndex: number,
    instances: Record<string, UIPropertyType>[],
  ): void {
    const descriptor = this.resolveDescriptor(userIndex);

    if (instances.length !== descriptor.count) {
      throw new Error(
        `Invalid number of instances for userIndex: ${userIndex}`,
      );
    }

    for (let i = 0; i < instances.length; i++) {
      const instance = instances[i];

      for (const [name, value] of Object.entries(instance)) {
        if (!resolveTypeInfo(value).instantiable) {
          this.shaderMaterial.uniforms[`u_${name}`].value = value;
          this.shaderMaterial.uniformsNeedUpdate = true;
        } else {
          const attribute = this.resolveBufferAttribute(name);
          const array = attribute.array as Float32Array;
          const itemSize = attribute.itemSize;
          const instanceOffset = (descriptor.firstIndex + i) * itemSize;

          if (value instanceof UIColor) {
            array[instanceOffset] = value.r;
            array[instanceOffset + ITEM_1_OFFSET] = value.g;
            array[instanceOffset + ITEM_2_OFFSET] = value.b;
            array[instanceOffset + ITEM_3_OFFSET] = value.a;
          } else if (value instanceof Vector2) {
            array[instanceOffset] = value.x;
            array[instanceOffset + ITEM_1_OFFSET] = value.y;
          } else if (value instanceof Vector3) {
            array[instanceOffset] = value.x;
            array[instanceOffset + ITEM_1_OFFSET] = value.y;
            array[instanceOffset + ITEM_2_OFFSET] = value.z;
          } else if (value instanceof Vector4) {
            array[instanceOffset] = value.x;
            array[instanceOffset + ITEM_1_OFFSET] = value.y;
            array[instanceOffset + ITEM_2_OFFSET] = value.z;
            array[instanceOffset + ITEM_3_OFFSET] = value.w;
          } else if (value instanceof Matrix2) {
            const elements = value.elements;
            for (let j = 0; j < elements.length; j++) {
              array[instanceOffset + j] = elements[j];
            }
          } else if (value instanceof Matrix3) {
            const elements = value.elements;
            for (let j = 0; j < elements.length; j++) {
              array[instanceOffset + j] = elements[j];
            }
          } else if (value instanceof Matrix4) {
            const elements = value.elements;
            for (let j = 0; j < elements.length; j++) {
              array[instanceOffset + j] = elements[j];
            }
          } else if (typeof value === "number") {
            array[instanceOffset] = value;
          }

          attribute.needsUpdate = true;
        }
      }
    }
  }

  public updateInstanceTransform(
    userIndex: number,
    instances: Matrix4[],
  ): void {
    const descriptor = this.resolveDescriptor(userIndex);

    if (instances.length > descriptor.count) {
      throw new Error(
        `Invalid number of instances for userIndex: ${userIndex}`,
      );
    }

    for (let i = 0; i < instances.length; i++) {
      const attribute = this.resolveBufferAttribute("v_instanceTransform");

      const array = attribute.array as Float32Array;
      const itemSize = attribute.itemSize;
      const instanceOffset = (descriptor.firstIndex + i) * itemSize;
      const elements = instances[i].elements;
      for (let j = 0; j < elements.length; j++) {
        array[instanceOffset + j] = elements[j];
      }
      attribute.needsUpdate = true;
    }
  }

  public updateUVTransform(userIndex: number, instances: Matrix3[]): void {
    const descriptor = this.resolveDescriptor(userIndex);

    if (instances.length > descriptor.count) {
      throw new Error(
        `Invalid number of instances for userIndex: ${userIndex}`,
      );
    }

    for (let i = 0; i < instances.length; i++) {
      const attribute = this.resolveBufferAttribute("v_uvTransform");

      const array = attribute.array as Float32Array;
      const itemSize = attribute.itemSize;
      const instanceOffset = (descriptor.firstIndex + i) * itemSize;
      const elements = instances[i].elements;
      for (let j = 0; j < elements.length; j++) {
        array[instanceOffset + j] = elements[j];
      }
      attribute.needsUpdate = true;
    }
  }

  public updateAlphaClip(userIndex: number, instances: number[]): void {
    const descriptor = this.resolveDescriptor(userIndex);

    if (instances.length !== descriptor.count) {
      throw new Error(
        `Invalid number of instances for userIndex: ${userIndex}`,
      );
    }

    for (let i = 0; i < instances.length; i++) {
      const attribute = this.resolveBufferAttribute("v_alphaTest");

      const array = attribute.array as Float32Array;
      const itemSize = attribute.itemSize;
      const instanceOffset = (descriptor.firstIndex + i) * itemSize;
      array[instanceOffset] = instances[i];
      attribute.needsUpdate = true;
    }
  }

  public destroy(): void {
    this.instancedGeometry.dispose();
    this.shaderMaterial.dispose();
  }

  private resolveDescriptor(userIndex: number): RangeDescriptor {
    const descriptor = this.userIndexToRangeDescriptor.get(userIndex);
    if (descriptor === undefined) {
      throw new Error(`No active range found for userIndex: ${userIndex}`);
    }
    return descriptor;
  }

  private resolveBufferAttribute(name: string): InstancedBufferAttribute {
    const attribute = this.propertyBuffers.get(name);
    if (attribute === undefined) {
      throw new Error(`No attribute found for property: ${name}`);
    }
    return attribute;
  }

  private resizeGeometry(newCapacity: number): void {
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

  private copyRangeData(
    sourceRange: RangeDescriptor,
    targetRange: RangeDescriptor,
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
    for (const descriptor of this.userIndexToRangeDescriptor.values()) {
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

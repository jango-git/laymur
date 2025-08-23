import {
  Color,
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

const CAPACITY_STEP = 16;

const GLSL_TYPE_MAP: Record<string, string | undefined> = {
  [Texture.name]: "sampler2D",
  [UIColor.name]: "vec4",
  [Color.name]: "vec3",
  [Vector2.name]: "vec2",
  [Vector3.name]: "vec3",
  [Vector4.name]: "vec4",
  [Matrix2.name]: "mat2",
  [Matrix3.name]: "mat3",
  [Matrix4.name]: "mat4",
};

export type UIPropertyType =
  | Texture
  | UIColor
  | Color
  | Vector2
  | Vector3
  | Vector4
  | Matrix2
  | Matrix3
  | Matrix4;

function isInstantiableProperty(type: UIPropertyType): boolean {
  return !(type instanceof Texture);
}

interface RangeDescriptor {
  firstIndex: number;
  count: number;
}

export class UIGenericInstancedPlane extends Mesh {
  protected instancedGeometry: InstancedBufferGeometry;
  protected shaderMaterial: ShaderMaterial;
  protected userIndexToRangeDescriptor: Map<number, RangeDescriptor> =
    new Map();

  protected nextUserIndex = 0;
  protected capacity = 0;
  protected propertyBuffers: Map<string, InstancedBufferAttribute> = new Map();

  constructor(
    source: string,
    private readonly properties: Record<string, UIPropertyType>,
    initialCapacity: number,
  ) {
    // Create plane geometry
    const plane = new PlaneGeometry(1, 1);
    const instancedGeometry = new InstancedBufferGeometry();
    instancedGeometry.index = plane.index;
    instancedGeometry.setAttribute("position", plane.attributes["position"]);
    instancedGeometry.setAttribute("uv", plane.attributes["uv"]);

    plane.dispose();

    // Create shader material
    const shaderMaterial = UIGenericInstancedPlane.createShaderMaterial(
      source,
      properties,
    );

    super(instancedGeometry, shaderMaterial);

    this.instancedGeometry = instancedGeometry;
    this.instancedGeometry.instanceCount = 0;

    this.shaderMaterial = shaderMaterial;
    this.capacity = Math.max(initialCapacity, CAPACITY_STEP);

    for (const [name, property] of Object.entries(this.properties)) {
      if (isInstantiableProperty(property)) {
        let attribute: InstancedBufferAttribute;

        if (property instanceof UIColor) {
          attribute = new InstancedBufferAttribute(
            new Float32Array(this.capacity * 4),
            4,
          );
        } else if (property instanceof Color) {
          attribute = new InstancedBufferAttribute(
            new Float32Array(this.capacity * 3),
            3,
          );
        } else if (property instanceof Vector2) {
          attribute = new InstancedBufferAttribute(
            new Float32Array(this.capacity * 2),
            2,
          );
        } else if (property instanceof Vector3) {
          attribute = new InstancedBufferAttribute(
            new Float32Array(this.capacity * 3),
            3,
          );
        } else if (property instanceof Vector4) {
          attribute = new InstancedBufferAttribute(
            new Float32Array(this.capacity * 4),
            4,
          );
        } else if (property instanceof Matrix2) {
          attribute = new InstancedBufferAttribute(
            new Float32Array(this.capacity * 4),
            4,
          );
        } else if (property instanceof Matrix3) {
          attribute = new InstancedBufferAttribute(
            new Float32Array(this.capacity * 9),
            9,
          );
        } else if (property instanceof Matrix4) {
          attribute = new InstancedBufferAttribute(
            new Float32Array(this.capacity * 16),
            16,
          );
        } else {
          throw new Error(
            `Unsupported property type: ${property.constructor.name}`,
          );
        }

        this.instancedGeometry.setAttribute(`a_${name}`, attribute);
        this.propertyBuffers.set(name, attribute);
      }
    }
  }

  private static createShaderMaterial(
    source: string,
    properties: Record<string, UIPropertyType>,
  ): ShaderMaterial {
    const uniforms: Record<string, { value: unknown }> = {};

    const uniformDeclarations: string[] = [];
    const attributeDeclarations: string[] = [];
    const varyingDeclarations: string[] = [];
    const vertexAssignments: string[] = [];

    for (const [name, property] of Object.entries(properties)) {
      const glslType = GLSL_TYPE_MAP[property.constructor.name];
      if (glslType === undefined) {
        throw new Error(
          `Unsupported property type: ${property.constructor.name}`,
        );
      }

      if (isInstantiableProperty(property)) {
        attributeDeclarations.push(`attribute ${glslType} a_${name};`);
        varyingDeclarations.push(`varying ${glslType} v_${name};`);
        vertexAssignments.push(`v_${name} = a_${name};`);
      } else {
        uniforms[`u_${name}`] = { value: property };
        uniformDeclarations.push(`uniform ${glslType} u_${name};`);
      }
    }

    const vertexShader = `
      ${attributeDeclarations.join("\n      ")}
      ${uniformDeclarations.join("\n      ")}

      ${varyingDeclarations.join("\n      ")}
      varying vec2 v_uv;

      void main() {
        ${vertexAssignments.join("\n        ")}
        v_uv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = `
      ${uniformDeclarations.join("\n      ")}
      ${varyingDeclarations.join("\n      ")}
      varying vec2 v_uv;

      ${source}
    `;

    return new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
    });
  }

  public allocateInstances(count: number): number {
    const userIndex = this.nextUserIndex++;

    if (this.instancedGeometry.instanceCount + count > this.capacity) {
      this.resizeGeometry(
        Math.ceil((this.capacity + count) / CAPACITY_STEP) * CAPACITY_STEP,
      );
    }

    this.instancedGeometry.instanceCount += count;
    this.userIndexToRangeDescriptor.set(userIndex, {
      firstIndex: this.instancedGeometry.instanceCount,
      count,
    });

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
      // Copy data from replacement range to deleted range position
      this.copyRangeData(replacementDescriptor, releasedDescriptor);

      // Update replacement range position
      replacementDescriptor.firstIndex = releasedDescriptor.firstIndex;

      // Shift all ranges above the replacement range down
      this.shiftRangesDown(
        replacementDescriptor.firstIndex + replacementDescriptor.count,
        replacementDescriptor.count,
      );
    } else {
      // No replacement found, shift all ranges above down
      this.shiftRangesDown(
        releasedDescriptor.firstIndex + releasedDescriptor.count,
        releasedDescriptor.count,
      );
    }

    this.instancedGeometry.instanceCount -= releasedDescriptor.count;
  }

  public updatePoperties(
    userIndex: number,
    properties: Record<string, UIPropertyType>,
  ): void {
    const descriptor = this.userIndexToRangeDescriptor.get(userIndex);
    if (descriptor === undefined) {
      throw new Error(`No active range found for userIndex: ${userIndex}`);
    }

    for (const [name, value] of Object.entries(properties)) {
      if (!isInstantiableProperty(value)) {
        this.shaderMaterial.uniforms[`u_${name}`].value = value;
        this.shaderMaterial.uniformsNeedUpdate = true;
      } else {
        const attribute = this.propertyBuffers.get(name);
        if (attribute === undefined) {
          throw new Error(`No attribute found for property: ${name}`);
        }

        const array = attribute.array as Float32Array;
        const itemSize = attribute.itemSize;
        const startIndex = descriptor.firstIndex * itemSize;

        for (let i = 0; i < descriptor.count; i++) {
          const instanceOffset = startIndex + i * itemSize;

          if (value instanceof UIColor) {
            array[instanceOffset] = value.r;
            array[instanceOffset + 1] = value.g;
            array[instanceOffset + 2] = value.b;
            array[instanceOffset + 3] = value.a;
          } else if (value instanceof Color) {
            array[instanceOffset] = value.r;
            array[instanceOffset + 1] = value.g;
            array[instanceOffset + 2] = value.b;
          } else if (value instanceof Vector2) {
            array[instanceOffset] = value.x;
            array[instanceOffset + 1] = value.y;
          } else if (value instanceof Vector3) {
            array[instanceOffset] = value.x;
            array[instanceOffset + 1] = value.y;
            array[instanceOffset + 2] = value.z;
          } else if (value instanceof Vector4) {
            array[instanceOffset] = value.x;
            array[instanceOffset + 1] = value.y;
            array[instanceOffset + 2] = value.z;
            array[instanceOffset + 3] = value.w;
          } else if (value instanceof Matrix2) {
            const elements = value.elements;
            for (let j = 0; j < 4; j++) {
              array[instanceOffset + j] = elements[j];
            }
          } else if (value instanceof Matrix3) {
            const elements = value.elements;
            for (let j = 0; j < 9; j++) {
              array[instanceOffset + j] = elements[j];
            }
          } else if (value instanceof Matrix4) {
            const elements = value.elements;
            for (let j = 0; j < 16; j++) {
              array[instanceOffset + j] = elements[j];
            }
          }
        }

        attribute.needsUpdate = true;
      }
    }
  }

  public destroy(): void {
    this.instancedGeometry.dispose();
    this.shaderMaterial.dispose();
  }

  private resizeGeometry(newCapacity: number): void {
    for (const [name, oldAttribute] of this.propertyBuffers.entries()) {
      const itemSize = oldAttribute.itemSize;
      const newArray = new Float32Array(newCapacity * itemSize);

      // Copy existing data
      newArray.set(oldAttribute.array as Float32Array);

      // Create new attribute
      const newAttribute = new InstancedBufferAttribute(newArray, itemSize);

      // Update geometry
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

      // Copy data from source to target
      for (let i = 0; i < dataLength; i++) {
        array[targetStart + i] = array[sourceStart + i];
      }

      attribute.needsUpdate = true;
    }
  }

  private shiftRangesDown(startIndex: number, shiftAmount: number): void {
    // Update firstIndex for all ranges that need to be shifted
    for (const descriptor of this.userIndexToRangeDescriptor.values()) {
      if (descriptor.firstIndex >= startIndex) {
        descriptor.firstIndex -= shiftAmount;
      }
    }

    // Shift actual data in buffers
    for (const attribute of this.propertyBuffers.values()) {
      const array = attribute.array as Float32Array;
      const itemSize = attribute.itemSize;

      const startByteIndex = startIndex * itemSize;
      const endByteIndex = this.instancedGeometry.instanceCount * itemSize;
      const shiftByteAmount = shiftAmount * itemSize;

      // Shift data down
      for (let i = startByteIndex; i < endByteIndex - shiftByteAmount; i++) {
        array[i] = array[i + shiftByteAmount];
      }

      attribute.needsUpdate = true;
    }
  }
}

import type { ShaderMaterial, Vector4 } from "three";
import { Matrix4, Mesh } from "three";
import { UIColor } from "../UIColor";
import { UITransparencyMode } from "../UITransparencyMode";
import {
  DEFAULT_ALPHA_TEST,
  resolveTypeInfo,
  resolveUniform,
  type UIPropertyType,
} from "./shared";
import { buildMaterial, PLANE_GEOMETRY } from "./UIGenericPlane.Internal";

/**
 * Single plane renderer for cases where instancing is not applicable.
 *
 * Use this when:
 * - Plane requires unique shader source
 * - Plane has render target as texture (cannot be batched)
 * - Only one instance of this plane type exists
 *
 * @remarks
 * Textures in uniforms are not disposed on destroy — caller retains ownership.
 */
export class UIGenericPlane extends Mesh {
  private readonly shaderMaterial: ShaderMaterial;
  private readonly propertiesInternal: Record<string, UIPropertyType>;
  private transformInternal = new Matrix4().identity();
  private transparencyInternal: UITransparencyMode;

  /**
   * Creates a new single plane renderer.
   *
   * @param source - GLSL fragment shader source (must define vec4 draw() function)
   * @param properties - Map of property names to values
   * @param transparency - Transparency rendering mode
   */
  constructor(
    public readonly source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
  ) {
    const shaderMaterial = buildMaterial(source, properties, transparency);
    super(PLANE_GEOMETRY, shaderMaterial);

    this.shaderMaterial = shaderMaterial;
    this.propertiesInternal = { ...properties };
    this.transparencyInternal = transparency;

    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
    this.matrixWorldAutoUpdate = false;
  }

  /**
   * Returns a copy of current properties.
   */
  public get properties(): Record<string, UIPropertyType> {
    return { ...this.propertiesInternal };
  }

  /**
   * Returns stored transform matrix or undefined if not set.
   */
  public get transform(): Matrix4 {
    return this.transformInternal;
  }

  /**
   * Returns current visibility state.
   */
  public get visibility(): boolean {
    return this.visible;
  }

  /**
   * Returns current transparency state.
   */
  public get transparency(): UITransparencyMode {
    return this.transparencyInternal;
  }

  /**
   * Updates properties.
   *
   * @param properties - Properties to update
   * @throws Error if property name is not in layout
   */
  public setProperties(properties: Record<string, UIPropertyType>): void {
    for (const [name, value] of Object.entries(properties)) {
      const uniform = resolveUniform(name, this.shaderMaterial);
      if (value instanceof UIColor) {
        value.toGLSLColor(uniform.value as Vector4);
      } else {
        uniform.value = value;
      }
      this.propertiesInternal[name] = value;
    }
    this.shaderMaterial.uniformsNeedUpdate = true;
  }

  /**
   * Updates the transform matrix.
   *
   * @param transform - Matrix4 transform to apply
   */
  public setTransform(transform: Matrix4): void {
    const uniform = resolveUniform("transform", this.shaderMaterial);
    (uniform.value as Matrix4).copy(transform);
    this.shaderMaterial.uniformsNeedUpdate = true;
    this.transformInternal = transform;
  }

  /**
   * Updates visibility state.
   *
   * @param visibility - Whether the plane should be visible
   */
  public setVisibility(visibility: boolean): void {
    this.visible = visibility;
  }

  /**
   * Updates transparency mode.
   *
   * @param transparency - New transparency mode
   */
  public setTransparency(transparency: UITransparencyMode): void {
    if (this.transparency !== transparency) {
      this.shaderMaterial.transparent =
        transparency === UITransparencyMode.BLEND;
      this.shaderMaterial.alphaTest =
        transparency === UITransparencyMode.CLIP ? DEFAULT_ALPHA_TEST : 0.0;
      this.shaderMaterial.alphaHash = transparency === UITransparencyMode.HASH;
      this.shaderMaterial.depthWrite =
        transparency !== UITransparencyMode.BLEND;
      this.shaderMaterial.needsUpdate = true;

      this.transparencyInternal = transparency;
    }
  }

  /**
   * Checks if the provided configuration is compatible with this instance.
   *
   * @param source - GLSL fragment shader source
   * @param properties - Map of property names to values
   * @param transparency - Transparency rendering mode
   * @returns true if the configuration matches the current instance, false otherwise
   */
  public isCompatible(
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
  ): boolean {
    if (this.source !== source || this.transparency !== transparency) {
      return false;
    }

    const keys = Object.keys(properties);
    const internalKeys = Object.keys(this.propertiesInternal);

    if (keys.length !== internalKeys.length) {
      return false;
    }

    for (const key of keys) {
      if (!(key in this.propertiesInternal)) {
        return false;
      }

      const newInfo = resolveTypeInfo(properties[key]);
      const internalInfo = resolveTypeInfo(this.propertiesInternal[key]);

      if (newInfo.glslType !== internalInfo.glslType) {
        return false;
      }

      // Non-instantiable (textures) must match by reference
      if (
        !newInfo.instantiable &&
        properties[key] !== this.propertiesInternal[key]
      ) {
        return false;
      }
    }

    return true;
  }

  /**
   * Disposes material resources.
   *
   * @remarks
   * Geometry is shared and not disposed.
   * Textures in uniforms are not disposed — caller retains ownership.
   */
  public destroy(): void {
    this.shaderMaterial.dispose();
  }
}

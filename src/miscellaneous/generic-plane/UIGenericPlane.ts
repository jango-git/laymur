import type { Matrix4, ShaderMaterial, Vector4 } from "three";
import { Mesh } from "three";
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
  private readonly storedProperties: Record<string, UIPropertyType>;
  private storedTransform: Matrix4 | null = null;
  private storedVisibility = true;

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
    public readonly transparency: UITransparencyMode = UITransparencyMode.BLEND,
  ) {
    const shaderMaterial = buildMaterial(source, properties, transparency);
    super(PLANE_GEOMETRY, shaderMaterial);

    this.shaderMaterial = shaderMaterial;
    this.storedProperties = { ...properties };
    this.frustumCulled = false;

    this.matrixAutoUpdate = false;
    this.matrixWorldAutoUpdate = false;
  }

  /**
   * Returns a copy of current properties.
   */
  public get properties(): Record<string, UIPropertyType> {
    return { ...this.storedProperties };
  }

  /**
   * Returns stored transform matrix or null if not set.
   */
  public get transform(): Matrix4 | null {
    return this.storedTransform;
  }

  /**
   * Returns current visibility state.
   */
  public get visibility(): boolean {
    return this.storedVisibility;
  }

  /**
   * Updates visibility state.
   *
   * @param visibility - Whether the plane should be visible
   */
  public updateVisibility(visibility: boolean): void {
    this.visible = visibility;
    this.storedVisibility = visibility;
  }

  /**
   * Updates the transform matrix.
   *
   * @param transform - Matrix4 transform to apply
   */
  public updateTransform(transform: Matrix4): void {
    const uniform = resolveUniform("transform", this.shaderMaterial);
    uniform.value = transform;
    this.shaderMaterial.uniformsNeedUpdate = true;
    this.storedTransform = transform;
  }

  /**
   * Updates properties.
   *
   * @param properties - Properties to update
   * @throws Error if property name is not in layout
   */
  public updateProperties(properties: Record<string, UIPropertyType>): void {
    for (const [name, value] of Object.entries(properties)) {
      const uniform = resolveUniform(name, this.shaderMaterial);
      if (value instanceof UIColor) {
        value.toGLSLColor(uniform.value as Vector4);
      } else {
        uniform.value = value;
      }
      this.storedProperties[name] = value;
    }
    this.shaderMaterial.uniformsNeedUpdate = true;
  }

  /**
   * Updates transparency mode.
   *
   * @param transparency - New transparency mode
   */
  public setTransparency(transparency: UITransparencyMode): void {
    if (this.transparency === transparency) {
      return;
    }

    // Обновляем material настройки
    const material = this.shaderMaterial;

    material.transparent = transparency === UITransparencyMode.BLEND;
    material.alphaTest =
      transparency === UITransparencyMode.CLIP ? DEFAULT_ALPHA_TEST : 0.0;
    material.alphaHash = transparency === UITransparencyMode.HASH;
    material.depthWrite = transparency !== UITransparencyMode.BLEND;
    material.needsUpdate = true;

    // Нужно обновить readonly поле - через приватное поле или type assertion
    (this as { transparency: UITransparencyMode }).transparency = transparency;
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
    transparency: UITransparencyMode = UITransparencyMode.BLEND,
  ): boolean {
    if (this.source !== source || this.transparency !== transparency) {
      return false;
    }

    const keys = Object.keys(properties);
    const currentKeys = Object.keys(this.storedProperties);

    if (keys.length !== currentKeys.length) {
      return false;
    }

    for (const key of keys) {
      if (!(key in this.storedProperties)) {
        return false;
      }

      const newInfo = resolveTypeInfo(properties[key]);
      const currentInfo = resolveTypeInfo(this.storedProperties[key]);

      if (newInfo.glslType !== currentInfo.glslType) {
        return false;
      }

      // Non-instantiable (textures) must match by reference
      if (
        !newInfo.instantiable &&
        properties[key] !== this.storedProperties[key]
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

import type { Matrix4, ShaderMaterial } from "three";
import { Mesh } from "three";
import { UITransparencyMode } from "../UITransparencyMode";
import {
  resolveUniform,
  type UIPropertyType,
  type UIPropertyTypeName,
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

  /**
   * Creates a new single plane renderer.
   *
   * @param source - GLSL fragment shader source (must define vec4 draw() function)
   * @param layout - Map of property names to types
   * @param transparency - Transparency rendering mode
   */
  constructor(
    source: string,
    layout: Record<string, UIPropertyTypeName>,
    transparency: UITransparencyMode = UITransparencyMode.BLEND,
  ) {
    const shaderMaterial = buildMaterial(source, layout, transparency);
    super(PLANE_GEOMETRY, shaderMaterial);

    this.shaderMaterial = shaderMaterial;
    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
  }

  public updateVisibility(visibility: boolean): void {
    this.visible = visibility;
  }

  /**
   * Updates the transform matrix.
   *
   * @param transform - Matrix4 transform to apply
   */
  public updateTransform(transform: Matrix4): void {
    this.matrixWorld.copy(transform);
  }

  /**
   * Updates a single property.
   *
   * @param name - Property name as defined in layout
   * @param value - New value for the property
   * @throws Error if property name is not in layout
   */
  public updateProperties(properties: Record<string, UIPropertyType>): void {
    for (const [name, value] of Object.entries(properties)) {
      const uniform = resolveUniform(name, this.shaderMaterial);
      uniform.value = value;
      this.shaderMaterial.uniformsNeedUpdate = true;
    }
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

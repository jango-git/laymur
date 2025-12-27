import type { Matrix4, ShaderMaterial, Vector4 } from "three";
import { Mesh, Texture } from "three";
import { UIColor } from "../../color/UIColor";
import { UITransparencyMode } from "../../UITransparencyMode";
import type {
  GLProperty,
  PlaneData,
  UIPropertyCopyFrom,
  UIPropertyCopyTo,
} from "../shared";
import {
  arePropertiesPartiallyCompatible,
  DEFAULT_ALPHA_TEST,
  resolvePropertyUniform,
} from "../shared";
import {
  buildGenericPlaneMaterial,
  PLANE_GEOMETRY,
} from "./UIGenericPlane.Internal";

/**
 * Single shader plane mesh.
 *
 * Does not clone inputs. Caller must ensure properties and transform
 * are not shared with external code.
 *
 * @internal
 */
export class UIGenericPlane extends Mesh {
  private readonly shaderMaterial: ShaderMaterial;
  private readonly properties: Record<string, GLProperty>;
  private readonly transform: Matrix4;
  private transparencyInternal: UITransparencyMode;

  constructor(
    private readonly source: string,
    properties: Record<string, GLProperty>,
    transform: Matrix4,
    visibility: boolean,
    transparency: UITransparencyMode,
  ) {
    const shaderMaterial = buildGenericPlaneMaterial(
      source,
      properties,
      transparency,
      transform,
    );
    super(PLANE_GEOMETRY, shaderMaterial);

    this.shaderMaterial = shaderMaterial;
    this.properties = properties;
    this.transparencyInternal = transparency;
    this.transform = transform;
    this.visible = visibility;

    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
    this.matrixWorldAutoUpdate = false;
  }

  /** Current transparency mode */
  public get transparency(): UITransparencyMode {
    return this.transparencyInternal;
  }

  /** Updates properties. Values are copied via .copy() methods. */
  public setProperties(properties: Record<string, GLProperty>): void {
    for (const name in properties) {
      const descriptor = properties[name];
      const uniform = resolvePropertyUniform(name, this.shaderMaterial);
      const descriptorValue = descriptor.value;

      if (descriptor.value instanceof UIColor) {
        descriptor.value.toGLSLColor(uniform.value as Vector4);
        (this.properties[name].value as UIColor).copy(descriptor.value);
      } else if (
        typeof descriptorValue === "number" ||
        descriptorValue instanceof Texture
      ) {
        uniform.value = descriptor.value;
        this.properties[name].value = descriptor.value;
      } else {
        const value = descriptor.value as UIPropertyCopyFrom;
        (uniform.value as UIPropertyCopyTo).copy(value);
        (this.properties[name].value as UIPropertyCopyTo).copy(value);
      }
    }
    this.shaderMaterial.uniformsNeedUpdate = true;
  }

  /** Updates transform. Matrix is copied. */
  public setTransform(transform: Matrix4): void {
    const uniform = resolvePropertyUniform("transform", this.shaderMaterial);
    (uniform.value as Matrix4).copy(transform);
    this.shaderMaterial.uniformsNeedUpdate = true;
    this.transform.copy(transform);
  }

  /** Updates visibility */
  public setVisibility(visibility: boolean): void {
    this.visible = visibility;
  }

  /** Updates transparency mode */
  public setTransparency(transparency: UITransparencyMode): void {
    if (this.transparencyInternal !== transparency) {
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

  /** Returns cloned plane data for reconstruction */
  public extractPlaneData(): PlaneData {
    return {
      source: this.source,
      properties: { ...this.properties },
      transform: this.transform.clone(),
      visibility: this.visible,
      transparency: this.transparencyInternal,
    };
  }

  /** Checks if plane can accept given properties without reconstruction */
  public isPartiallyCompatible(
    source: string,
    properties: Record<string, GLProperty>,
    transparency: UITransparencyMode,
  ): boolean {
    if (this.transparencyInternal !== transparency || this.source !== source) {
      return false;
    }

    return arePropertiesPartiallyCompatible(this.properties, properties);
  }

  /** Checks if properties are compatible with current plane configuration */
  public arePropertiesPartiallyCompatible(
    properties: Record<string, GLProperty>,
  ): boolean {
    return arePropertiesPartiallyCompatible(this.properties, properties);
  }

  /** Disposes shader material */
  public destroy(): void {
    this.shaderMaterial.dispose();
  }
}

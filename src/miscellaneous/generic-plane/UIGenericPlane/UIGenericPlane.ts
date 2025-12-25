import type { ShaderMaterial, Vector4 } from "three";
import { Matrix4, Mesh } from "three";
import { UIColor } from "../../color/UIColor";
import { UITransparencyMode } from "../../UITransparencyMode";
import type { GLProperty, PlaneData } from "../shared";
import {
  arePropertiesPartiallyCompatible,
  DEFAULT_ALPHA_TEST,
  resolvePropertyUniform,
} from "../shared";
import {
  buildGenericPlaneMaterial,
  PLANE_GEOMETRY,
} from "./UIGenericPlane.Internal";

export class UIGenericPlane extends Mesh {
  private readonly shaderMaterial: ShaderMaterial;
  private readonly properties: Record<string, GLProperty>;
  private readonly transform = new Matrix4().identity();
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
    this.properties = { ...properties };
    this.transparencyInternal = transparency;
    this.transform.copy(transform);
    this.visible = visibility;

    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
    this.matrixWorldAutoUpdate = false;
  }

  public get transparency(): UITransparencyMode {
    return this.transparencyInternal;
  }

  public setProperties(properties: Record<string, GLProperty>): void {
    for (const name in properties) {
      const descriptor = properties[name];
      const uniform = resolvePropertyUniform(name, this.shaderMaterial);

      if (descriptor.value instanceof UIColor) {
        descriptor.value.toGLSLColor(uniform.value as Vector4);
      } else {
        uniform.value = descriptor.value;
      }
      this.properties[name] = descriptor;
    }
    this.shaderMaterial.uniformsNeedUpdate = true;
  }

  public setTransform(transform: Matrix4): void {
    const uniform = resolvePropertyUniform("transform", this.shaderMaterial);
    (uniform.value as Matrix4).copy(transform);
    this.shaderMaterial.uniformsNeedUpdate = true;
    this.transform.copy(transform);
  }

  public setVisibility(visibility: boolean): void {
    this.visible = visibility;
  }

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

  public extractPlaneData(): PlaneData {
    return {
      source: this.source,
      properties: { ...this.properties },
      transform: this.transform.clone(),
      visibility: this.visible,
      transparency: this.transparencyInternal,
    };
  }

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

  public arePropertiesPartiallyCompatible(
    properties: Record<string, GLProperty>,
  ): boolean {
    return arePropertiesPartiallyCompatible(this.properties, properties);
  }

  public destroy(): void {
    this.shaderMaterial.dispose();
  }
}

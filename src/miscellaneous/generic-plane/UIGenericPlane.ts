import type { ShaderMaterial, Vector4 } from "three";
import { Matrix4, Mesh } from "three";

import { UIColor } from "../color/UIColor";
import { UITransparencyMode } from "../UITransparencyMode";
import type { GenericPlaneData, UIPropertyType } from "./shared";
import {
  arePropertiesCompatible,
  DEFAULT_ALPHA_TEST,
  resolveUniform,
} from "./shared";
import {
  buildGenericPlaneMaterial,
  PLANE_GEOMETRY,
} from "./UIGenericPlane.Internal";

export class UIGenericPlane extends Mesh {
  private readonly shaderMaterial: ShaderMaterial;
  private readonly propertiesInternal: Record<string, UIPropertyType>;
  private readonly transformInternal = new Matrix4().identity();
  private transparencyInternal: UITransparencyMode;

  constructor(
    public readonly source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
  ) {
    const shaderMaterial = buildGenericPlaneMaterial(
      source,
      properties,
      transparency,
    );
    super(PLANE_GEOMETRY, shaderMaterial);

    this.frustumCulled = false;
    this.matrixAutoUpdate = false;
    this.matrixWorldAutoUpdate = false;

    this.shaderMaterial = shaderMaterial;
    this.propertiesInternal = { ...properties };
    this.transparencyInternal = transparency;
  }

  public get properties(): Record<string, UIPropertyType> {
    return { ...this.propertiesInternal };
  }

  public get transform(): Matrix4 {
    return this.transformInternal;
  }

  public get visibility(): boolean {
    return this.visible;
  }

  public get transparency(): UITransparencyMode {
    return this.transparencyInternal;
  }

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

  public setTransform(transform: Matrix4): void {
    const uniform = resolveUniform("transform", this.shaderMaterial);
    (uniform.value as Matrix4).copy(transform);
    this.shaderMaterial.uniformsNeedUpdate = true;
    this.transformInternal.copy(transform);
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

  public extractInstanceData(): GenericPlaneData {
    return {
      source: this.source,
      properties: this.properties,
      transparency: this.transparencyInternal,
      transform: this.transformInternal.clone(),
      visibility: this.visible,
    };
  }

  public isCompatible(
    source: string,
    properties: Record<string, UIPropertyType>,
    transparency: UITransparencyMode,
  ): boolean {
    if (this.transparencyInternal !== transparency || this.source !== source) {
      return false;
    }

    return arePropertiesCompatible(this.propertiesInternal, properties);
  }

  public arePropertiesCompatible(
    properties: Record<string, UIPropertyType>,
  ): boolean {
    return arePropertiesCompatible(this.propertiesInternal, properties);
  }

  public destroy(): void {
    this.shaderMaterial.dispose();
  }
}

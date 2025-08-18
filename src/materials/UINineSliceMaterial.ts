import type { Texture } from "three";
import { Color, ShaderMaterial, Vector2, Vector4 } from "three";
import fragmentShader from "../shaders/UINineSliceMaterial.fs";
import vertexShader from "../shaders/UINineSliceMaterial.vs";

const DEFAULT_ALPHA_TEST = 0.025;

export class UINineSliceMaterial extends ShaderMaterial {
  constructor(texture: Texture) {
    super({
      uniforms: {
        map: { value: texture },
        color: { value: new Color(0xffffff) },
        opacity: { value: 1.0 },
        alphaTest: { value: DEFAULT_ALPHA_TEST },
        sliceBorders: {
          value: new Vector4(0, 0, 0, 0),
        }, // left, right, top, bottom (in UV)
        quadSize: { value: new Vector2(1, 1) }, // width, height (in World)
        textureSize: {
          value: new Vector2(texture.image.width, texture.image.height),
        },
      },
      vertexShader,
      fragmentShader,
      transparent: false,
      alphaTest: DEFAULT_ALPHA_TEST,
      lights: false,
      fog: false,
      depthWrite: true,
      depthTest: true,
    });
  }

  public getSliceBorderLeft(): number {
    return this.uniforms.sliceBorders.value.x;
  }

  public getSliceBorderRight(): number {
    return this.uniforms.sliceBorders.value.y;
  }

  public getSliceBorderTop(): number {
    return this.uniforms.sliceBorders.value.z;
  }

  public getSliceBorderBottom(): number {
    return this.uniforms.sliceBorders.value.w;
  }

  public getQuadSize(): { w: number; h: number } {
    const quadSize = this.uniforms.quadSize.value;
    return { w: quadSize.x, h: quadSize.y };
  }

  public getTexture(): Texture {
    return this.uniforms.map.value;
  }

  public getColor(): number {
    return (this.uniforms.color.value as Color).getHex();
  }

  public getOpacity(): number {
    return this.uniforms.opacity.value;
  }

  public getTransparency(): boolean {
    return this.transparent;
  }

  public setSliceBorderLeft(l: number): this {
    this.uniforms.sliceBorders.value.x = l;
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setSliceBorderRight(r: number): this {
    this.uniforms.sliceBorders.value.y = r;
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setSliceBorderTop(t: number): this {
    this.uniforms.sliceBorders.value.z = t;
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setSliceBorderBottom(b: number): this {
    this.uniforms.sliceBorders.value.w = b;
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setSliceBorder(l: number, r: number, t: number, b: number): this {
    this.uniforms.sliceBorders.value.set(l, r, t, b);
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setQuadSize(w: number, h: number): this {
    this.uniforms.quadSize.value.set(w, h);
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setTexture(value: Texture): this {
    this.uniforms.map.value = value;
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setColor(color: number): this {
    (this.uniforms.color.value as Color).setHex(color);
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setOpacity(opacity: number): this {
    this.uniforms.opacity.value = opacity;
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setTransparency(value: boolean): this {
    if (this.transparent !== value) {
      this.transparent = value;
      this.uniforms.alphaTest.value = !value ? DEFAULT_ALPHA_TEST : 0;
      this.needsUpdate = true;
      this.uniformsNeedUpdate = true;
    }
    return this;
  }
}

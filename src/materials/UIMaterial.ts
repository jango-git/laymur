import type { Texture } from "three";
import { Color, ShaderMaterial } from "three";
import fragmentShader from "../shaders/UIMaterial.fs";
import vertexShader from "../shaders/UIMaterial.vs";

const DEFAULT_ALPHA_TEST = 0.25;

export class UIMaterial extends ShaderMaterial {
  constructor(map?: Texture) {
    super({
      uniforms: {
        map: { value: map },
        opacity: { value: 1.0 },
        color: { value: new Color(1.0, 1.0, 1.0) },
        alphaTest: { value: DEFAULT_ALPHA_TEST },
      },
      vertexShader,
      fragmentShader,
      transparent: false,
      alphaTest: DEFAULT_ALPHA_TEST,
      lights: false,
      fog: false,
      depthWrite: false,
      depthTest: false,
    });
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

  public setTexture(value: Texture): this {
    this.uniforms.map.value = value;
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setColor(value: number): this {
    (this.uniforms.color.value as Color).setHex(value);
    this.uniformsNeedUpdate = true;
    return this;
  }

  public setOpacity(value: number): this {
    this.uniforms.opacity.value = value;
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

import type { Texture } from "three";
import { Color, ShaderMaterial, UniformsUtils } from "three";
import fragmentShader from "../shaders/UIProgressMaterial.fs";
import vertexShader from "../shaders/UIProgressMaterial.vs";

const DEFAULT_ALPHA_TEST = 0.025;

export class UIProgressMaterial extends ShaderMaterial {
  constructor(foregroundTexture: Texture, backgroundTexture?: Texture) {
    super({
      uniforms: UniformsUtils.merge([
        {
          background: { value: backgroundTexture },
          foreground: { value: foregroundTexture },
          progress: { value: 1 },
          backgroundColor: { value: new Color(1, 1, 1) },
          foregroundColor: { value: new Color(1, 1, 1) },
          backgroundOpacity: { value: 1 },
          foregroundOpacity: { value: 1 },
          alphaTest: { value: DEFAULT_ALPHA_TEST },
          angle: { value: 0 },
          direction: { value: 1 },
        },
      ]),
      vertexShader,
      fragmentShader,
      transparent: true,
      lights: false,
      fog: false,
      depthWrite: false,
      depthTest: false,
    });
  }

  public getProgress(): number {
    return this.uniforms.progress.value;
  }

  public getBackgroundTexture(): Texture | undefined {
    return this.uniforms.background.value;
  }

  public getForegroundTexture(): Texture {
    return this.uniforms.foreground.value;
  }

  public getBackgroundColor(): number {
    return (this.uniforms.backgroundColor.value as Color).getHex();
  }

  public getForegroundColor(): number {
    return (this.uniforms.foregroundColor.value as Color).getHex();
  }

  public getBackgroundOpacity(): number {
    return this.uniforms.backgroundOpacity.value;
  }

  public getForegroundOpacity(): number {
    return this.uniforms.foregroundOpacity.value;
  }

  public getTransparency(): boolean {
    return this.transparent;
  }

  public getAngle(): number {
    return this.uniforms.angle.value;
  }

  public getIsForwardDirection(): boolean {
    return this.uniforms.direction.value === 1;
  }

  public setProgress(value: number): void {
    this.uniforms.progress.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setBackgroundTexture(value: Texture | undefined): void {
    this.uniforms.background.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setForegroundTexture(value: Texture): void {
    this.uniforms.foreground.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setBackgroundColor(value: number): void {
    (this.uniforms.backgroundColor.value as Color).setHex(value);
    this.uniformsNeedUpdate = true;
  }

  public setForegroundColor(value: number): void {
    (this.uniforms.foregroundColor.value as Color).setHex(value);
    this.uniformsNeedUpdate = true;
  }

  public setBackgroundOpacity(value: number): void {
    this.uniforms.backgroundOpacity.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setForegroundOpacity(value: number): void {
    this.uniforms.foregroundOpacity.value = value;
    this.uniformsNeedUpdate = true;
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

  public setAngle(value: number): void {
    this.uniforms.angle.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setIsForwardDirection(value: boolean): void {
    this.uniforms.direction.value = value ? 1 : -1;
    this.uniformsNeedUpdate = true;
  }
}

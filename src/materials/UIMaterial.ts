import type { Texture } from "three";
import { Color, ShaderMaterial } from "three";

const DEFAULT_ALPHA_TEST = 0.25;

export class UIMaterial extends ShaderMaterial {
  constructor(map: Texture) {
    super({
      uniforms: {
        map: { value: map },
        opacity: { value: 1.0 },
        color: { value: new Color(1.0, 1.0, 1.0) },
      },
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D map;
        uniform float opacity;
        uniform vec3 color;
        varying vec2 vUv;

        void main() {
          vec4 textureColor = texture2D(map, vUv);
          gl_FragColor = vec4(textureColor.rgb * color, textureColor.a * opacity);
          #include <colorspace_fragment>
        }
      `,
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

  public setTexture(value: Texture): void {
    this.uniforms.map.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setColor(value: number): void {
    (this.uniforms.color.value as Color).setHex(value);
    this.uniformsNeedUpdate = true;
  }

  public setOpacity(value: number): void {
    this.uniforms.opacity.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setTransparency(value: boolean): void {
    if (this.transparent !== value) {
      this.transparent = value;
      this.alphaTest = value ? DEFAULT_ALPHA_TEST : 0;

      this.needsUpdate = true;
      this.uniformsNeedUpdate = true;
    }
  }
}

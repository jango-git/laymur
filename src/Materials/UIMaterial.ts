import type { Texture } from "three";
import { Color, Matrix3, ShaderMaterial, UniformsUtils } from "three";

export class UIMaterial extends ShaderMaterial {
  constructor(map: Texture) {
    super({
      uniforms: UniformsUtils.merge([
        {
          map: { value: map },
          opacity: { value: 1.0 },
          color: { value: new Color(1.0, 1.0, 1.0) },
          uvTransform: { value: new Matrix3() },
        },
      ]),
      vertexShader: /* glsl */ `
        uniform mat3 uvTransform;
        varying vec2 vUv;
        void main() {
          vUv = (uvTransform * vec3(uv, 1)).xy;
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
      transparent: true,
      fog: false,
      lights: false,
    });
  }

  public getTexture(): Texture {
    return this.uniforms.map.value;
  }

  public getColor(): Color {
    return this.uniforms.color.value;
  }

  public getOpacity(): number {
    return this.uniforms.opacity.value;
  }

  public getUVTransform(): Matrix3 {
    return this.uniforms.uvTransform.value;
  }

  public setTexture(value: Texture): void {
    this.uniforms.map.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setColor(value: Color): void {
    this.uniforms.color.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setOpacity(value: number): void {
    this.uniforms.opacity.value = value;
    this.uniformsNeedUpdate = true;
  }

  public setUVTransform(value: Matrix3): void {
    this.uniforms.uvTransform.value = value;
    this.uniformsNeedUpdate = true;
  }
}

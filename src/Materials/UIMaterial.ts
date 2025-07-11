import type { Texture } from "three";
import {
  AddEquation,
  AdditiveBlending,
  Color,
  CustomBlending,
  MultiplyBlending,
  NormalBlending,
  OneFactor,
  OneMinusDstColorFactor,
  ShaderMaterial,
  SubtractiveBlending,
} from "three";
import { UIBlending } from "../Miscellaneous/UIBlending";

export class UIMaterial extends ShaderMaterial {
  constructor(map?: Texture) {
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
      transparent: true,
      lights: false,
      fog: false,
      depthWrite: false,
      depthTest: false,
    });
  }

  public getTexture(): Texture | undefined {
    return this.uniforms.map.value;
  }

  public getColor(): number {
    return (this.uniforms.color.value as Color).getHex();
  }

  public getOpacity(): number {
    return this.uniforms.opacity.value;
  }

  public setTexture(value: Texture | undefined): void {
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

  public setBlending(blending: UIBlending): void {
    switch (blending) {
      case UIBlending.ADDITIVE:
        this.blending = AdditiveBlending;
        break;

      case UIBlending.SUBTRACTIVE:
        this.blending = SubtractiveBlending;
        break;

      case UIBlending.MULTIPLY:
        this.blending = MultiplyBlending;
        break;

      case UIBlending.SCREEN:
        this.blending = CustomBlending;
        this.blendEquation = AddEquation;
        this.blendSrc = OneMinusDstColorFactor;
        this.blendDst = OneFactor;
        break;

      default:
        this.blending = NormalBlending;
        break;
    }
  }
}

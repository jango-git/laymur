import type { Texture } from "three";
import { Color, Matrix3, ShaderMaterial, UniformsUtils } from "three";
import { materialSymbol } from "../Miscellaneous/symbols";

export class UIEnhancedMaterial {
  public readonly [materialSymbol]: ShaderMaterial;
  constructor(texture: Texture) {
    const uniforms = UniformsUtils.merge([
      {
        map: { value: texture },
        opacity: { value: 1.0 },
        color: { value: new Color(1.0, 1.0, 1.0) },
        uvTransform: { value: new Matrix3() },
        saturation: { value: 1.0 },
        brightness: { value: 1.0 },
        hue: { value: 0.0 },
      },
    ]);

    const vertexShader = /* glsl */ `
      uniform mat3 uvTransform;
      varying vec2 vUv;
      void main() {
        vUv = (uvTransform * vec3(uv, 1)).xy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `;

    const fragmentShader = /* glsl */ `
      uniform sampler2D map;
      uniform float opacity;
      uniform vec3 color;
      uniform float saturation;
      uniform float brightness;
      uniform float hue;
      varying vec2 vUv;

      vec3 rgb2hsv(vec3 c) {
        vec4 K = vec4(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
        vec4 p = mix(vec4(c.bg, K.wz), vec4(c.gb, K.xy), step(c.b, c.g));
        vec4 q = mix(vec4(p.xyw, c.r), vec4(c.r, p.yzx), step(p.x, c.r));
        float d = q.x - min(q.w, q.y);
        float e = 1.0e-10;
        return vec3(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
      }

      vec3 hsv2rgb(vec3 c) {
        vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
        vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
        return c.z * mix(K.xxx, clamp(p - K. xxx, 0.0, 1.0), c.y);
      }

      void main() {
        gl_FragColor = texture2D(map, vUv);

        #include <colorspace_fragment>

        vec3 hsv = rgb2hsv(gl_FragColor.rgb);

        hsv.x = fract(hsv.x + hue);
        hsv.y = clamp(hsv.y * saturation, 0.0, 1.0);
        hsv.z = hsv.z * brightness;

        vec3 rgb = hsv2rgb(hsv);
        gl_FragColor = vec4(rgb * color, gl_FragColor.a * opacity);
      }
    `;

    this[materialSymbol] = new ShaderMaterial({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      fog: false,
      lights: false,
    });
  }

  public get color(): Color {
    return this[materialSymbol].uniforms.color.value;
  }

  public get opacity(): number {
    return this[materialSymbol].uniforms.opacity.value;
  }

  public get saturation(): number {
    return this[materialSymbol].uniforms.saturation.value;
  }

  public get brightness(): number {
    return this[materialSymbol].uniforms.brightness.value;
  }

  public get hue(): number {
    return this[materialSymbol].uniforms.hue.value;
  }

  public set color(value: Color) {
    this[materialSymbol].uniforms.color.value = value;
  }

  public set saturation(value: number) {
    this[materialSymbol].uniforms.saturation.value = value;
  }

  public set brightness(value: number) {
    this[materialSymbol].uniforms.brightness.value = value;
  }

  public set hue(value: number) {
    this[materialSymbol].uniforms.hue.value = value;
  }

  public set opacity(value: number) {
    this[materialSymbol].uniforms.opacity.value = value;
  }
}

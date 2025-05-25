import type { Texture, WebGLRenderer } from "three";
import { Color, Matrix3, ShaderMaterial, UniformsUtils } from "three";
import { UIFullScreenQuad } from "./UIFullScreenQuad";

export class UIDrawPass {
  private readonly screen: UIFullScreenQuad;

  constructor() {
    this.screen = new UIFullScreenQuad(
      new ShaderMaterial({
        uniforms: UniformsUtils.merge([
          {
            map: { value: null },
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
      }),
    );
  }

  public destroy(): void {
    this.screen.material.dispose();
  }

  public setPadding(width: number, height: number, padding: number): void {
    if (padding <= 0) {
      this.screen.paddingHorizontal = 0;
      this.screen.paddingVertical = 0;
    } else {
      this.screen.paddingHorizontal = padding / width;
      this.screen.paddingVertical = padding / height;
    }
  }

  public render(renderer: WebGLRenderer, texture: Texture): void {
    this.screen.material.uniforms.map.value = texture;
    this.screen.material.uniformsNeedUpdate = true;
    this.screen.render(renderer);
  }
}

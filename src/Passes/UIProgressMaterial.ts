import type { Texture } from "three";
import { ShaderMaterial, UniformsUtils } from "three";

export class UIProgressMaterial extends ShaderMaterial {
  constructor(backgroundTexture: Texture, foregroundTexture: Texture) {
    super({
      uniforms: UniformsUtils.merge([
        {
          map: { value: backgroundTexture },
          foreground: { value: foregroundTexture },
          progress: { value: 0 },
        },
      ]),
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D map;
        uniform sampler2D foreground;
        uniform float progress;
        varying vec2 vUv;

        void main() {
          vec4 background = texture2D(map, vUv);
          vec4 foreground = texture2D(foreground, vUv);
          gl_FragColor = mix(background, foreground, step(vUv.x, progress));
          #include <colorspace_fragment>
        }
      `,
      transparent: true,
      fog: false,
      lights: false,
    });
  }
}

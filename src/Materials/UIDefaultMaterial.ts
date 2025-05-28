import type { Texture } from "three";
import { ShaderMaterial, UniformsUtils } from "three";

export class UIDefaultMaterial extends ShaderMaterial {
  constructor(map?: Texture) {
    super({
      uniforms: UniformsUtils.merge([{ map: { value: map } }]),
      vertexShader: /* glsl */ `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: /* glsl */ `
        uniform sampler2D map;
        varying vec2 vUv;

        void main() {
          gl_FragColor = texture2D(map, vUv);
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

  public setTexture(value: Texture): void {
    this.uniforms.map.value = value;
    this.uniformsNeedUpdate = true;
  }
}

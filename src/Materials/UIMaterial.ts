import type { Texture } from "three";
import { Matrix3, ShaderMaterial, UniformsUtils } from "three";

export class UIMaterial extends ShaderMaterial {
  constructor(texture: Texture) {
    const uniforms = UniformsUtils.merge([
      {
        map: { value: texture },
        uvTransform: { value: new Matrix3() },
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
      varying vec2 vUv;

      void main() {
        vec4 texelColor = texture2D(map, vUv);
        gl_FragColor = vec4(texelColor.rgb, texelColor.a);

        #include <colorspace_fragment>
      }
    `;

    super({
      uniforms,
      vertexShader,
      fragmentShader,
      transparent: true,
      fog: false,
      lights: false,
    });
  }
}

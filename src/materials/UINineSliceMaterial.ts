// import type { Texture } from "three";
// import { Color, ShaderMaterial, Vector2, Vector4 } from "three";

// const DEFAULT_ALPHA_TEST = 0.025;
// const DEFAULT_SLICE_BORDER = 0.25;

// export class UINineSliceMaterial extends ShaderMaterial {
//   constructor(texture: Texture) {
//     super({
//       uniforms: {
//         map: { value: texture },
//         color: { value: new Color(0xffffff) },
//         opacity: { value: 1.0 },
//         alphaTest: { value: DEFAULT_ALPHA_TEST },
//         sliceBorders: {
//           value: new Vector4(
//             DEFAULT_SLICE_BORDER,
//             DEFAULT_SLICE_BORDER,
//             DEFAULT_SLICE_BORDER,
//             DEFAULT_SLICE_BORDER,
//           ),
//         }, // left, right, top, bottom (в UV)
//         atlasRect: { value: new Vector4(0, 0, 1, 1) }, // x, y, w, h (в UV)
//         quadSize: { value: new Vector2(1, 1) },
//         textureSize: {
//           value: new Vector2(texture.image.width, texture.image.height),
//         },
//       },
//       vertexShader: /* glsl */ `
//         varying vec2 vUv;
//         void main() {
//           vUv = uv;
//           gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
//         }
//       `,
//       fragmentShader: /* glsl */ `
//         uniform sampler2D map;
//         uniform vec3 color;
//         uniform float opacity;
//         uniform float alphaTest;
//         uniform vec4 sliceBorders;
//         uniform vec4 atlasRect;
//         uniform vec2 quadSize;
//         uniform vec2 textureSize;
//         varying vec2 vUv;

//         vec2 calcNineSliceUV(vec2 uv) {
//           vec2 localUV = uv;

//           float left = sliceBorders.x;
//           float right = sliceBorders.y;
//           float top = sliceBorders.z;
//           float bottom = sliceBorders.w;

//           vec2 texPx = textureSize * atlasRect.zw;

//           float leftPx = left * texPx.x;
//           float rightPx = right * texPx.x;
//           float topPx = top * texPx.y;
//           float bottomPx = bottom * texPx.y;

//           float lB = leftPx / quadSize.x;
//           float rB = 1.0 - (rightPx / quadSize.x);
//           float tB = topPx / quadSize.y;
//           float bB = 1.0 - (bottomPx / quadSize.y);

//           float regionL = step(uv.x, lB);
//           float regionR = step(rB, uv.x);
//           float regionM = 1.0 - regionL - regionR;

//           float xL = uv.x * (left / lB);
//           float xR = 1.0 - right + ((uv.x - rB) / (1.0 - rB)) * right;
//           float xM = left + ((uv.x - lB) / (rB - lB)) * (1.0 - left - right);

//           localUV.x = regionL * xL + regionM * xM + regionR * xR;

//           float regionT = step(uv.y, tB);
//           float regionBtm = step(bB, uv.y);
//           float regionC = 1.0 - regionT - regionBtm;

//           float yT = uv.y * (top / tB);
//           float yB = 1.0 - bottom + ((uv.y - bB) / (1.0 - bB)) * bottom;
//           float yC = top + ((uv.y - tB) / (bB - tB)) * (1.0 - top - bottom);

//           localUV.y = regionT * yT + regionC * yC + regionBtm * yB;

//           return atlasRect.xy + localUV * atlasRect.zw;
//         }

//         void main() {
//           vec2 uv = calcNineSliceUV(vUv);
//           vec4 texel = texture2D(map, uv);
//           if (texel.a < alphaTest) discard;
//           gl_FragColor = vec4(texel.rgb * color, texel.a * opacity);
//           #include <colorspace_fragment>
//         }
//       `,
//       transparent: false,
//       alphaTest: DEFAULT_ALPHA_TEST,
//       lights: false,
//       fog: false,
//       depthWrite: true,
//       depthTest: true,
//     });
//   }

//   public getTexture(): Texture {
//     return this.uniforms.map.value;
//   }

//   public getColor(): number {
//     return (this.uniforms.color.value as Color).getHex();
//   }

//   public getOpacity(): number {
//     return this.uniforms.opacity.value;
//   }

//   public getTransparency(): boolean {
//     return this.transparent;
//   }

//   public setSliceBorders(
//     l: number,
//     r: number,
//     t: number,
//     b: number,
//   ): UINineSliceMaterial {
//     this.uniforms.sliceBorders.value.set(l, r, t, b);
//     this.uniformsNeedUpdate = true;
//     return this;
//   }

//   public setQuadSize(width: number, height: number): UINineSliceMaterial {
//     this.uniforms.quadSize.value.set(width, height);
//     this.uniformsNeedUpdate = true;
//     return this;
//   }

//   public setAtlasRect(
//     x: number,
//     y: number,
//     w: number,
//     h: number,
//   ): UINineSliceMaterial {
//     this.uniforms.atlasRect.value.set(x, y, w, h);
//     this.uniformsNeedUpdate = true;
//     return this;
//   }

//   public setColor(color: Color): UINineSliceMaterial {
//     this.uniforms.color.value.copy(color);
//     this.uniformsNeedUpdate = true;
//     return this;
//   }

//   public setOpacity(opacity: number): UINineSliceMaterial {
//     this.uniforms.opacity.value = opacity;
//     this.uniformsNeedUpdate = true;
//     return this;
//   }
// }

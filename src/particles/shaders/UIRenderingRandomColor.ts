import { buildIndexExpression, toGLSLFloat } from "../miscellaneous/miscellaneous.js";

/** Source that reads one texel of a palette texture by `PARTICLE_RANDOM` */
export function buildRandomColorSource(paletteSize: number): string {
  return `
vec4 draw() {
  float index = ${buildIndexExpression("PARTICLE_RANDOM", paletteSize)};
  return srgbTexture2D(p_paletteTexture, vec2((index + 0.5) / ${toGLSLFloat(paletteSize)}, 0.5));
}
`;
}

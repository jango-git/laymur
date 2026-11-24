import { buildGradientCoordinate } from "../miscellaneous/miscellaneous.js";

export function buildColorOverLifeSource(gradientSize: number): string {
  return /* glsl */ `
vec4 draw() {
  float t = clamp(PARTICLE_AGE / PARTICLE_LIFETIME, 0.0, 1.0);
  return srgbTexture2D(p_colorOverLifeTexture, vec2(${buildGradientCoordinate("t", gradientSize)}, 0.5));
}
`;
}

import { buildGradientCoordinate, toGLSLFloat } from "../miscellaneous/miscellaneous.js";

export function buildColorOverVelocitySource(gradientSize: number, maxVelocity: number): string {
  return `
vec4 draw() {
  float t = clamp(length(vec2(PARTICLE_VELOCITY_X, PARTICLE_VELOCITY_Y)) / ${toGLSLFloat(maxVelocity)}, 0.0, 1.0);
  return srgbTexture2D(p_colorOverVelocityTexture, vec2(${buildGradientCoordinate("t", gradientSize)}, 0.5));
}
`;
}

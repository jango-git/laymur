/**
 * The empty COLOR_OVER_VELOCITY_MAX macro is a placeholder: UIRenderingColorOverVelocity
 * rewrites the first occurrence of that token into "COLOR_OVER_VELOCITY_MAX <value>",
 * which turns this line into a real definition. The newline after it is load-bearing -
 * a "#define" body runs to end of line, so collapsing it would swallow draw() into
 * the macro and leave the shader without an entry point.
 */
const source: string = `
#define COLOR_OVER_VELOCITY_MAX

vec4 draw() {
  float t = clamp(length(vec2(PARTICLE_VELOCITY_X, PARTICLE_VELOCITY_Y)) / COLOR_OVER_VELOCITY_MAX, 0.0, 1.0);
  return srgbTexture2D(p_colorOverVelocityTexture, vec2(t, 0.5));
}
`;

export default source;

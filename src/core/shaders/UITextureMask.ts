/**
 * Coverage of a texture mask.
 *
 * Arguments:
 * - unit: point in the unit square of the mask frame, where the mask value is 0 outside of it
 * - uv: the same point in the mask texture
 * - parameters: (channel, threshold, softness, inverted), channel 0..3 for r, g, b, a
 *
 * The mask value is remapped linearly so that the threshold lands on 0.5 and a band as wide as
 * the softness spans 0..1. The band is at least a pixel wide where screen-space derivatives are
 * available. On WebGL1 they need OES_standard_derivatives, enabled where the includer defines
 * LAYMUR_MASK_DERIVATIVES.
 */
const source: string = /* glsl */ `
uniform sampler2D laymurMaskTexture;

float laymurTextureMaskCoverage(vec2 unit, vec2 uv, vec4 parameters) {
    vec4 texel = texture2D(laymurMaskTexture, uv);
    vec4 channelWeights = vec4(equal(vec4(floor(parameters.x + 0.5)), vec4(0.0, 1.0, 2.0, 3.0)));
    vec2 inside = step(vec2(0.0), unit) * step(unit, vec2(1.0));
    float value = dot(texel, channelWeights) * inside.x * inside.y;

    #if __VERSION__ >= 300 || (defined(LAYMUR_MASK_DERIVATIVES) && defined(GL_OES_standard_derivatives))
        float band = max(parameters.z, fwidth(value));
    #else
        float band = parameters.z;
    #endif

    float coverage = band > 0.0
        ? clamp((value - parameters.y) / band + 0.5, 0.0, 1.0)
        : step(parameters.y, value);
    return parameters.w > 0.5 ? 1.0 - coverage : coverage;
}
`;

export default source;

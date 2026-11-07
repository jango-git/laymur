/**
 * Coverage of an analytic mask, shared by masked planes and patched external materials.
 *
 * Arguments:
 * - p: point in mask-local space (centered, world units)
 * - shape: (half width, half height, corner radius, softness); the radius is already clamped
 * - mode: shape (0 = rectangle, 1 = ellipse) + 2 when inverted
 *
 * The edge is antialiased over a pixel through screen-space derivatives. On WebGL1 they need
 * OES_standard_derivatives enabled for the program: the includer defines LAYMUR_MASK_DERIVATIVES
 * only where it asked three.js to enable it. Without derivatives a world unit is taken as the
 * pixel size.
 */
const source: string = `
float laymurMaskDistance(vec2 p, vec4 shape, float kind) {
    if (kind > 0.5) {
        // Divided one axis at a time: radii squared overflow mediump on large masks
        vec2 radii = max(shape.xy, vec2(1e-4));
        vec2 normalized = p / radii;
        float k0 = length(normalized);
        float k1 = length(normalized / radii);
        return k1 > 0.0 ? k0 * (k0 - 1.0) / k1 : -min(radii.x, radii.y);
    }
    vec2 q = abs(p) - shape.xy + shape.z;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - shape.z;
}

float laymurMaskCoverage(vec2 p, vec4 shape, float mode) {
    bool inverted = mode > 1.5;
    float kind = inverted ? mode - 2.0 : mode;
    float signedDistance = laymurMaskDistance(p, shape, kind);

    #if __VERSION__ >= 300 || (defined(LAYMUR_MASK_DERIVATIVES) && defined(GL_OES_standard_derivatives))
        // Euclidean per axis, so the band stays a pixel wide on rotated masks
        float pixel = max(max(length(dFdx(p)), length(dFdy(p))), 1e-4);
    #else
        float pixel = 1.0;
    #endif

    float coverage = clamp((0.5 * pixel - signedDistance) / (shape.w + pixel), 0.0, 1.0);
    coverage = coverage * coverage * (3.0 - 2.0 * coverage);
    return inverted ? 1.0 - coverage : coverage;
}
`;

export default source;

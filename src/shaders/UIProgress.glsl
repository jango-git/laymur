// Required properties:
// - p_uv: vec2 (builtin)
// - p_foregroundTexture: sampler2D
// - p_backgroundTexture: sampler2D
// - p_color: vec4
// - p_foregroundColor: vec4
// - p_backgroundColor: vec4
// - p_progress: float
// - p_direction: float

vec4 draw() {
    vec4 foregroundDiffuseColor = texture2D(p_foregroundTexture, p_uv) * p_foregroundColor * p_color;
    vec4 backgroundDiffuseColor = texture2D(p_backgroundTexture, p_uv) * p_backgroundColor * p_color;

    float mask = calculateMask();
    vec4 diffuseColor = foregroundDiffuseColor * mask
            + backgroundDiffuseColor * (1.0 - foregroundDiffuseColor.a * mask);

    return diffuseColor;
}

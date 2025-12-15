// Required properties:
// - p_uv: vec2 (builtin)
// - p_texture: sampler2D
// - p_textureTransform: mat3
// - p_textureResolution: vec2
// - p_color: vec4
// - p_progress: float
// - p_direction: float

vec4 draw() {
    vec2 transformedUV = (p_textureTransform * vec3(p_uv, 1.0)).xy;
    vec4 diffuseColor = texture2D(p_texture, transformedUV) * p_color;
    diffuseColor.a *= calculateMask();
    return diffuseColor;
}

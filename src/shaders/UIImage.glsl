// Required properties:
// - p_uv: vec2 (builtin)
// - p_texture: sampler2D
// - p_textureTransform: mat3
// - p_color: vec4

vec4 draw() {
    vec2 transformedUV = (p_textureTransform * vec3(p_uv, 1.0)).xy;
    return texture2D(p_texture, transformedUV) * p_color;
}

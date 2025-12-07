vec4 draw() {
    return texture(p_map, (p_uvTransform * vec3(p_uv, 1.0)).xy) * p_color;
}

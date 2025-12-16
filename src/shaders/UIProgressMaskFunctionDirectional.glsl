float calculateMask() {
    float aspect = p_textureResolution.x / p_textureResolution.y;
    vec2 halfExtents = vec2(aspect, 1.0) * 0.5;

    float maxProjection = dot(halfExtents, abs(p_direction));

    vec2 correctedUV = (p_uv - 0.5) * vec2(aspect, 1.0);
    float projection = dot(correctedUV, p_direction);

    float offset = (projection / maxProjection + 1.0) * 0.5;
    return step(offset, p_progress);
}

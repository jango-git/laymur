float calculateMask() {
    float aspect = p_textureResolution.x / p_textureResolution.y;
    vec2 p = (p_uv - 0.5) * vec2(aspect, 1.0);

    float angle = atan(p.y, p.x);
    angle = (angle + PI) / (2.0 * PI);

    float adjusted = angle - p_startAngle;
    adjusted = p_direction > 0.0 ? adjusted : -adjusted;
    adjusted = fract(adjusted);

    return step(adjusted, p_progress);
}

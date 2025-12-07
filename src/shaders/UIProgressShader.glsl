vec4 draw() {
    vec4 foregroundDiffuseColor = texture2D(p_foregroundTexture, p_uv) * p_foregroundColor * p_color;
    vec4 backgroundDiffuseColor = texture2D(p_backgroundTexture, p_uv) * p_backgroundColor * p_color;

    float mask = calculateMask();
    vec4 diffuseColor = foregroundDiffuseColor * mask
            + backgroundDiffuseColor * (1.0 - foregroundDiffuseColor.a * mask);

    return diffuseColor;
}

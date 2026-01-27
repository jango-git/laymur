vec4 draw() {
  float speed = length(p_linearVelocity);
  float t = clamp(speed / p_colorOverVelocityMax, 0.0, 1.0);
  return srgbTexture2D(p_colorOverVelocityTexture, vec2(t, 0.5));
}

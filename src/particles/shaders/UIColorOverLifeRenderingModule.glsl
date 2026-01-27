vec4 draw() {
  float t = clamp(p_lifetime.y / p_lifetime.x, 0.0, 1.0);
  return srgbTexture2D(p_colorOverLifeTexture, vec2(t, 0.5));
}

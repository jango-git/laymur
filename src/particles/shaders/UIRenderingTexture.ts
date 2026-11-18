import { buildIndexExpression } from "../miscellaneous/miscellaneous.js";

/** Source that draws one texture region */
export const textureSource = `
vec4 draw() {
  vec2 transformedUV = (p_textureTransform * vec3(p_uv, 1.0)).xy;
  return srgbTexture2D(p_texture, transformedUV);
}
`;

/** Source that draws one of `count` regions of a texture, picked by `PARTICLE_RANDOM` */
export function buildMultiTextureSource(count: number): string {
  const branches: string[] = [];
  for (let i = 0; i < count; i++) {
    if (i === 0) {
      branches.push(`  if (idx == 0) t = p_textureTransform0;`);
    } else if (i === count - 1) {
      branches.push(`  else t = p_textureTransform${i};`);
    } else {
      branches.push(`  else if (idx == ${i}) t = p_textureTransform${i};`);
    }
  }

  return [
    "vec4 draw() {",
    `  int idx = int(${buildIndexExpression("PARTICLE_RANDOM", count)});`,
    "  mat3 t;",
    ...branches,
    "  vec2 transformedUV = (t * vec3(p_uv, 1.0)).xy;",
    "  return srgbTexture2D(p_texture, transformedUV);",
    "}",
  ].join("\n");
}

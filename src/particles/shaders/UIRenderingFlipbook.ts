import { toGLSLFloat } from "../miscellaneous/miscellaneous.js";

/**
 * Source of a flipbook: `frameExpression` gives the frame number as a whole float in
 * [0, frameCount), frames read row by row from the top left of the sheet
 */
export function buildFlipbookSource(
  frameExpression: string,
  columns: number,
  rows: number,
): string {
  const columnCount = toGLSLFloat(columns);
  const rowCount = toGLSLFloat(rows);
  return /* glsl */ `
vec4 draw() {
  float frame = ${frameExpression};
  // Offset by half a frame, so that floor does not drop a whole quotient computed just below it
  float row = floor((frame + 0.5) / ${columnCount});
  float column = frame - row * ${columnCount};
  vec2 cellUV = (vec2(column, ${rowCount} - 1.0 - row) + p_uv) / vec2(${columnCount}, ${rowCount});
  return srgbTexture2D(p_texture, (p_textureTransform * vec3(cellUV, 1.0)).xy);
}
`;
}

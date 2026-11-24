import { toGLSLFloat } from "../miscellaneous/miscellaneous.js";

/**
 * Source of a white shape whose alpha falls off over `softness` of its edge distance
 * @param distanceExpression GLSL expression of the distance in the quad point `p`, from -1 to 1:
 * below 1 inside the shape, 1 on its edge
 */
export function buildShapeSource(distanceExpression: string, softness: number): string {
  return /* glsl */ `
vec4 draw() {
  vec2 p = p_uv * 2.0 - 1.0;
  float shapeDistance = ${distanceExpression};
  return vec4(1.0, 1.0, 1.0, 1.0 - smoothstep(${toGLSLFloat(1 - softness)}, 1.0, shapeDistance));
}
`;
}

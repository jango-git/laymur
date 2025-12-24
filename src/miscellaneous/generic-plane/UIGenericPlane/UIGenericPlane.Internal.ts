import { Matrix4, PlaneGeometry, ShaderMaterial } from "three";
import { UIColor } from "../../color/UIColor";
import { UITransparencyMode } from "../../UITransparencyMode";
import type { GLProperty } from "../shared";
import { buildGenericPlaneFragmentShader, DEFAULT_ALPHA_TEST } from "../shared";

export const PLANE_GEOMETRY = new PlaneGeometry(1, 1).translate(0.5, 0.5, 0);

export function buildGenericPlaneMaterial(
  source: string,
  properties: Record<string, GLProperty>,
  transparency: UITransparencyMode,
): ShaderMaterial {
  const uniforms: Record<string, { value: unknown }> = {
    // eslint-disable-next-line @typescript-eslint/naming-convention -- unform name
    p_transform: { value: new Matrix4() },
  };

  const uniformDeclarations: string[] = [];

  for (const name in properties) {
    const { value, glslTypeInfo } = properties[name];
    uniforms[`p_${name}`] = {
      value: value instanceof UIColor ? value.toGLSLColor() : value,
    };
    uniformDeclarations.push(`uniform ${glslTypeInfo.glslTypeName} p_${name};`);
  }

  const vertexShader = `
    // Default uniform declarations
    uniform mat4 p_transform;

    // Custom uniform declarations
    ${uniformDeclarations.join("\n")}

    // Default varying declarations
    varying vec3 p_position;
    varying vec2 p_uv;

    void main() {
      p_position = position;
      p_uv = uv;

      gl_Position = projectionMatrix * p_transform * vec4(position, 1.0);
    }
  `;

  const fragmentShader = buildGenericPlaneFragmentShader(
    uniformDeclarations,
    [],
    source,
  );

  const material = new ShaderMaterial({
    uniforms,
    vertexShader,
    fragmentShader,
    transparent: transparency === UITransparencyMode.BLEND,
    alphaTest:
      transparency === UITransparencyMode.CLIP ? DEFAULT_ALPHA_TEST : 0.0,
    alphaHash: transparency === UITransparencyMode.HASH,
    depthWrite: transparency !== UITransparencyMode.BLEND,
    depthTest: true,
  });

  return material;
}

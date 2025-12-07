import { PlaneGeometry, ShaderMaterial } from "three";
import { UITransparencyMode } from "../UITransparencyMode";
import {
  DEFAULT_ALPHA_TEST,
  resolveTypeInfo,
  type UIPropertyTypeName,
} from "./shared";

export const PLANE_GEOMETRY = new PlaneGeometry(1, 1).translate(0.5, 0.5, 0);

export function buildMaterial(
  source: string,
  uniformLayout: Record<string, UIPropertyTypeName>,
  transparency: UITransparencyMode,
): ShaderMaterial {
  const uniforms: Record<string, { value: null }> = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    u_transform: { value: null },
  };

  const uniformDeclarations: string[] = [];
  const varyingDeclarations: string[] = [];
  const vertexAssignments: string[] = [];

  for (const [name, propertyTypeName] of Object.entries(uniformLayout)) {
    const info = resolveTypeInfo(propertyTypeName);
    uniforms[`u_${name}`] = { value: null };
    uniformDeclarations.push(`uniform ${info.glslType} u_${name};`);
  }

  const vertexShader = `
    // Default uniform declaractions
    uniform mat4 u_transform;

    // Custom uniform declaractions
    ${uniformDeclarations.join("\n")}

    // Default varying declaractions
    varying vec3 v_position;
    varying vec2 v_uv;

    // Custom varying declaractions
    ${varyingDeclarations.join("\n")}

    void main() {
      ${vertexAssignments.join("\n")}

      v_position = position;
      v_uv = uv;

      gl_Position = projectionMatrix * u_transform * vec4(position, 1.0);
    }
  `;

  const fragmentShader = `
    // Uniform declaractions
    ${uniformDeclarations.join("\n")}

    // Default varying declaractions
    varying vec3 v_position;
    varying vec2 v_uv;

    // Custom varying declaractions
    ${varyingDeclarations.join("\n")}

    #include <alphahash_pars_fragment>

    // Source have to define 'draw' function
    ${source}

    void main() {
      vec4 diffuseColor = draw();

      #ifdef USE_ALPHATEST
        if (diffuseColor.a < ${DEFAULT_ALPHA_TEST.toFixed(2)}) {
          discard;
        }
      #endif

      #ifdef USE_ALPHAHASH
        if (diffuseColor.a < getAlphaHashThreshold(v_position)) {
          discard;
        }
      #endif

      gl_FragColor = linearToOutputTexel(diffuseColor);
    }
  `;

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

import { PlaneGeometry, ShaderMaterial } from "three";
import { UITransparencyMode } from "../UITransparencyMode";
import {
  DEFAULT_ALPHA_TEST,
  resolveTypeInfo,
  type UIPropertyType,
} from "./shared";

export const PLANE_GEOMETRY = new PlaneGeometry(1, 1).translate(0.5, 0.5, 0);

export function buildMaterial(
  source: string,
  properties: Record<string, UIPropertyType>,
  transparency: UITransparencyMode,
): ShaderMaterial {
  const uniforms: Record<string, { value: null }> = {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    p_transform: { value: null },
  };

  const uniformDeclarations: string[] = [];

  for (const [name, value] of Object.entries(properties)) {
    const info = resolveTypeInfo(value);
    uniforms[`p_${name}`] = { value: null };
    uniformDeclarations.push(`uniform ${info.glslType} p_${name};`);
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

  const fragmentShader = `
    // Uniform declarations
    ${uniformDeclarations.join("\n")}

    // Default varying declarations
    varying vec3 p_position;
    varying vec2 p_uv;

    #include <alphahash_pars_fragment>

    // Source must define 'draw' function
    ${source}

    void main() {
      vec4 diffuseColor = draw();

      #ifdef USE_ALPHATEST
        if (diffuseColor.a < ${DEFAULT_ALPHA_TEST.toFixed(2)}) {
          discard;
        }
      #endif

      #ifdef USE_ALPHAHASH
        if (diffuseColor.a < getAlphaHashThreshold(p_position)) {
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

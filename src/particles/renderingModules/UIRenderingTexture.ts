import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared";
import { UITextureView } from "../../core/miscellaneous/texture/UITextureView";
import type { UITextureConfig } from "../../core/miscellaneous/texture/UITextureView.Internal";
import source from "../shaders/UIRenderingTexture.glsl";
import { UIRenderingModule } from "./UIRenderingModule";

function buildMultiTextureShader(count: number): string {
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
    `  int idx = int(PARTICLE_RANDOM_A * ${count}.0);`,
    "  mat3 t;",
    ...branches,
    "  vec2 transformedUV = (t * vec3(p_uv, 1.0)).xy;",
    "  return srgbTexture2D(p_texture, transformedUV);",
    "}",
  ].join("\n");
}

/**
 * Renders particles with a texture.
 *
 * Accepts a single texture config or an array of configs from the same atlas.
 * When an array is provided, each particle picks one texture randomly using PARTICLE_RANDOM_A.
 * All configs in the array must share the same underlying Three.js Texture object.
 */
export class UIRenderingTexture extends UIRenderingModule {
  /** @internal */
  public override readonly requiredProperties?: Record<string, UIPropertyName>;
  /** @internal */
  public readonly requiredUniforms: Record<string, UIProperty>;
  /** @internal */
  public readonly source: string;

  /**
   * @param config - Single texture config or array of configs (same atlas required for arrays)
   */
  constructor(config: UITextureConfig | UITextureConfig[]) {
    super();

    if (!Array.isArray(config) || config.length === 1) {
      const view = new UITextureView(Array.isArray(config) ? config[0] : config);
      this.source = source;
      this.requiredUniforms = {
        texture: view.texture,
        textureTransform: view.calculateUVTransform(),
      };
      return;
    }

    if (config.length === 0) {
      throw new Error("UIRenderingTexture.constructor: config array cannot be empty");
    }

    const views = config.map((c) => new UITextureView(c));
    const baseTexture = views[0].texture;

    for (let i = 1; i < views.length; i++) {
      if (views[i].texture !== baseTexture) {
        throw new Error(
          `UIRenderingTexture.constructor: all configs must share the same Three.js Texture (index ${i} differs)`,
        );
      }
    }

    const uniforms: Record<string, UIProperty> = { texture: baseTexture };
    for (let i = 0; i < views.length; i++) {
      uniforms[`textureTransform${i}`] = views[i].calculateUVTransform();
    }

    this.requiredProperties = { builtin: "Matrix4" };
    this.requiredUniforms = uniforms;
    this.source = buildMultiTextureShader(views.length);
  }
}

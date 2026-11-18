import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared.js";
import type { UITextureConfig } from "../../core/miscellaneous/texture/UITextureView.Internal.js";
import { UITextureView } from "../../core/miscellaneous/texture/UITextureView.js";
import { buildMultiTextureSource, textureSource } from "../shaders/UIRenderingTexture.js";
import { UIRenderingModule } from "./UIRenderingModule.js";

/**
 * Renders particles with a texture.
 *
 * Accepts a single texture config or an array of configs from the same atlas.
 * When an array is provided, each particle picks one texture randomly using PARTICLE_RANDOM.
 * All configs in the array must share the same underlying Three.js Texture object.
 */
export class UIRenderingTexture extends UIRenderingModule {
  public override readonly requiredProperties?: Record<string, UIPropertyName>;
  public readonly requiredUniforms: Record<string, UIProperty>;
  public readonly source: string;

  /**
   * @param config - Single texture config or array of configs (same atlas required for arrays)
   */
  constructor(config: UITextureConfig | UITextureConfig[]) {
    super();

    if (!Array.isArray(config) || config.length === 1) {
      const view = new UITextureView(Array.isArray(config) ? config[0] : config);
      this.source = textureSource;
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
    this.source = buildMultiTextureSource(views.length);
  }
}

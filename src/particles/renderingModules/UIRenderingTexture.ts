import type { UIProperty } from "../../core/miscellaneous/generic-plane/shared";
import { UITextureView } from "../../core/miscellaneous/texture/UITextureView";
import type { UITextureConfig } from "../../core/miscellaneous/texture/UITextureView.Internal";
import source from "../shaders/UIRenderingTexture.glsl";
import { UIRenderingModule } from "./UIRenderingModule";

/**
 * Renders particles with a texture.
 *
 * Samples the texture using particle UV coordinates.
 */
export class UITextureRenderingModule extends UIRenderingModule {
  /** @internal */
  public readonly requiredUniforms: Record<string, UIProperty>;
  /** @internal */
  public readonly source = source;
  private readonly texture: UITextureView;

  /**
   * @param config - Texture configuration
   */
  constructor(config: UITextureConfig) {
    super();
    this.texture = new UITextureView(config);
    this.requiredUniforms = {
      texture: this.texture.texture,
      textureTransform: this.texture.calculateUVTransform(),
    };
  }
}

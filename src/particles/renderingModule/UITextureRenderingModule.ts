import { UITextureView } from "../../core/miscellaneous/texture/UITextureView";
import type { UITextureConfig } from "../../core/miscellaneous/texture/UITextureView.Internal";
import type { UIParticleProperty } from "../instancedParticle/shared";
import source from "../shaders/UITextureRenderingModule.glsl";
import { UIRenderingModule } from "./UIRenderingModule";

export class UITextureRenderingModule extends UIRenderingModule {
  public readonly requiredUniforms: Record<string, UIParticleProperty>;
  public readonly source = source;

  constructor(config: UITextureConfig) {
    super();
    const texture = new UITextureView(config);
    this.requiredUniforms = {
      texture: texture.texture,
      textureTransform: texture.calculateUVTransform(),
    };
  }
}

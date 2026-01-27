import type { UIProperty } from "../../core/miscellaneous/generic-plane/shared";
import { UITextureView } from "../../core/miscellaneous/texture/UITextureView";
import type { UITextureConfig } from "../../core/miscellaneous/texture/UITextureView.Internal";
import source from "../shaders/UIRenderingTexture.glsl";
import { UIRenderingModule } from "./UIRenderingModule";

export class UITextureRenderingModule extends UIRenderingModule {
  /** @internal */
  public readonly requiredUniforms: Record<string, UIProperty>;
  /** @internal */
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

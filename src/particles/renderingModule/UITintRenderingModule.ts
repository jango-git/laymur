import type { UIColor } from "../../core";
import type { UIParticleProperty } from "../instancedParticle/shared";
import source from "../shaders/UITintRenderingModule.glsl";
import { UIRenderingModule } from "./UIRenderingModule";

export class UITintRenderingModule extends UIRenderingModule {
  public readonly requiredUniforms: Record<string, UIParticleProperty>;
  public readonly source = source;

  constructor(color: UIColor) {
    super();
    this.requiredUniforms = { tintColor: color.toGLSLColor() };
  }
}

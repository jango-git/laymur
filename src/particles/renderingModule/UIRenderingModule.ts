import type { UIParticleProperty, UIParticlePropertyName } from "../instancedParticle/shared";

export abstract class UIRenderingModule {
  public readonly requiredProperties?: Record<string, UIParticlePropertyName>;
  public abstract readonly requiredUniforms: Record<string, UIParticleProperty>;
  public abstract readonly source: string;
}

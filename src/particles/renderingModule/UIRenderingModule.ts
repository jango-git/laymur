import type { UIParticleProperty, UIParticlePropertyName } from "../instancedParticle/shared";

export abstract class UIRenderingModule {
  /** @internal */
  public readonly requiredProperties?: Record<string, UIParticlePropertyName>;
  /** @internal */
  public abstract readonly requiredUniforms: Record<string, UIParticleProperty>;
  /** @internal */
  public abstract readonly source: string;
}

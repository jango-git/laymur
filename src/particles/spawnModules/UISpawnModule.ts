import type { PropertyTypeMap, UIParticlePropertyName } from "../instancedParticle/shared";

export type ResolveProperties<T extends Record<string, UIParticlePropertyName>> = {
  [K in keyof T]: PropertyTypeMap[T[K]];
};

export abstract class UISpawnModule<
  T extends Record<string, UIParticlePropertyName> = Record<string, UIParticlePropertyName>,
> {
  public abstract readonly requiredProperties: T;
  public abstract spawn(): ResolveProperties<T>;
}

import type { InstancedBufferAttribute } from "three";
import type { PropertyTypeMap, UIParticlePropertyName } from "../instancedParticle/shared";

export type ResolveProperties<T extends Record<string, UIParticlePropertyName>> = {
  [K in keyof T]: PropertyTypeMap[T[K]];
};

export abstract class UISpawnModule<
  T extends Record<string, UIParticlePropertyName> = Record<string, UIParticlePropertyName>,
> {
  /** @internal */
  public abstract readonly requiredProperties: T;
  /** @internal */
  public abstract spawn(
    properties: { [K in keyof T]: InstancedBufferAttribute },
    instanceOffset: number,
    instanceCount: number,
  ): void;
}

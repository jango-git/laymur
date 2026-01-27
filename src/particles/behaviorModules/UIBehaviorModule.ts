import type { InstancedBufferAttribute } from "three";
import type { UIParticlePropertyName } from "../instancedParticle/shared";

export abstract class UIBehaviorModule<
  T extends Record<string, UIParticlePropertyName> = Record<string, UIParticlePropertyName>,
> {
  public abstract readonly requiredProperties: T;
  public abstract update(
    properties: { [K in keyof T]: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void;
}

import type { InstancedBufferAttribute } from "three";
import type { UIPropertyName } from "../../core/miscellaneous/generic-plane/shared";
import type { PropertyTypeMap } from "../instancedParticle/shared";

export type ResolveProperties<T extends Record<string, UIPropertyName>> = {
  [K in keyof T]: PropertyTypeMap[T[K]];
};

export abstract class UISpawnModule<
  T extends Record<string, UIPropertyName> = Record<string, UIPropertyName>,
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

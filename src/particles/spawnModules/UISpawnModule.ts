import type { InstancedBufferAttribute } from "three";
import type { UIPropertyName } from "../../core/miscellaneous/generic-plane/shared";

/**
 * Base class for particle spawn modules.
 *
 * Spawn modules initialize particle properties when particles are created.
 */
export abstract class UISpawnModule<
  T extends Record<string, UIPropertyName> = Record<string, UIPropertyName>,
> {
  /** @internal */
  public abstract readonly requiredProperties: T;
  /** @internal */
  public abstract spawn(
    properties: { [K in keyof T]: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void;

  public destroy?(): void;
}

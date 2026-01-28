import type { InstancedBufferAttribute } from "three";
import type { UIPropertyName } from "../../core/miscellaneous/generic-plane/shared";

export abstract class UIBehaviorModule<
  T extends Record<string, UIPropertyName> = Record<string, UIPropertyName>,
> {
  public abstract readonly requiredProperties: T;
  public abstract update(
    properties: { [K in keyof T]: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void;

  public destroy?(): void;
}

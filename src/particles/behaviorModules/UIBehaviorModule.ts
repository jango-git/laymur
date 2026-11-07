import type { InstancedBufferAttribute } from "three";
import type { UIPropertyName } from "../../core/miscellaneous/generic-plane/shared.js";

/**
 * Base class for particle behavior modules.
 *
 * Behavior modules update particle properties each frame. Declare the per-particle properties
 * the module touches in `requiredProperties` and change them in `update`.
 */
export abstract class UIBehaviorModule<
  T extends Record<string, UIPropertyName> = Record<string, UIPropertyName>,
> {
  /** Per-particle properties the module reads and writes, by name and type */
  public abstract readonly requiredProperties: T;
  /**
   * Advances the particles in [0, instanceCount) by deltaTime seconds.
   * @param properties Per-particle buffers of the required properties
   */
  public abstract update(
    properties: { [K in keyof T]: InstancedBufferAttribute },
    instanceCount: number,
    deltaTime: number,
  ): void;

  public destroy?(): void;
}

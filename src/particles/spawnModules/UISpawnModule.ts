import type { InstancedBufferAttribute } from "three";
import type { UIPropertyName } from "../../core/miscellaneous/generic-plane/shared.js";

/**
 * Base class for particle spawn modules.
 *
 * Spawn modules initialize particle properties when particles are created. Declare the
 * per-particle properties the module writes in `requiredProperties`, usually
 * `{ builtin: "Matrix4" }` (laid out by the BUILTIN_OFFSET_* constants), and fill them in `spawn`.
 */
export abstract class UISpawnModule<
  T extends Record<string, UIPropertyName> = Record<string, UIPropertyName>,
> {
  /** Per-particle properties the module writes, by name and type */
  public abstract readonly requiredProperties: T;
  /**
   * Initializes the particles in [instanceBegin, instanceEnd).
   * @param properties Per-particle buffers of the required properties
   */
  public abstract spawn(
    properties: { [K in keyof T]: InstancedBufferAttribute },
    instanceBegin: number,
    instanceEnd: number,
  ): void;

  public destroy?(): void;
}

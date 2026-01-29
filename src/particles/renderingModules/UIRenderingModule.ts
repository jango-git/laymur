import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared";

/**
 * Base class for particle rendering modules.
 *
 * Rendering modules provide fragment shader code and uniforms for particle appearance.
 */
export abstract class UIRenderingModule {
  /** @internal */
  public readonly requiredProperties?: Record<string, UIPropertyName>;
  /** @internal */
  public abstract readonly requiredUniforms: Record<string, UIProperty>;
  /** @internal */
  public abstract readonly source: string;

  public destroy?(): void;
}

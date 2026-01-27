import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared";

export abstract class UIRenderingModule {
  /** @internal */
  public readonly requiredProperties?: Record<string, UIPropertyName>;
  /** @internal */
  public abstract readonly requiredUniforms: Record<string, UIProperty>;
  /** @internal */
  public abstract readonly source: string;
}

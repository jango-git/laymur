import type { DataTexture } from "three";
import type { UIColor } from "../../core/index.js";
import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared.js";
import { buildGradientTexture } from "../miscellaneous/miscellaneous.js";
import source from "../shaders/UIRenderingColorOverLife.js";
import { UIRenderingModule } from "./UIRenderingModule.js";

/**
 * Colors particles based on lifetime progression.
 *
 * Interpolates through color gradient as particles age from birth to death.
 */
export class UIRenderingColorOverLife extends UIRenderingModule {
  /** @internal */
  public override readonly requiredProperties: Record<string, UIPropertyName> = {
    builtin: "Matrix4",
  } as const;
  /** @internal */
  public readonly requiredUniforms: Record<string, UIProperty>;
  /** @internal */
  public readonly source = source;

  /**
   * @param colors - Color gradient stops from birth to death
   */
  constructor(colors: UIColor[]) {
    super();

    if (colors.length === 0) {
      throw new Error("UIRenderingColorOverLife.constructor.colors: colors array cannot be empty");
    }

    this.requiredUniforms = { colorOverLifeTexture: buildGradientTexture(colors) };
  }

  public override destroy(): void {
    (this.requiredUniforms.colorOverLifeTexture as DataTexture).dispose();
  }
}

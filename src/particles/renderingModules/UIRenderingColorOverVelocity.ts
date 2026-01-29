import type { DataTexture } from "three";
import type { UIColor } from "../../core";
import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared";
import { buildGradientTexture } from "../miscellaneous/miscellaneous";
import source from "../shaders/UIRenderingColorOverVelocity.glsl";
import { UIRenderingModule } from "./UIRenderingModule";

/**
 * Colors particles based on velocity magnitude.
 *
 * Maps velocity from 0 to maxVelocity across the color gradient.
 */
export class UIRenderingColorOverVelocity extends UIRenderingModule {
  /** @internal */
  public override readonly requiredProperties: Record<string, UIPropertyName> = {
    builtin: "Matrix4",
  } as const;
  /** @internal */
  public readonly requiredUniforms: Record<string, UIProperty>;
  /** @internal */
  public readonly source = source;

  /**
   * @param colors - Color gradient from slow to fast
   * @param maxVelocity - Velocity mapped to final color
   */
  constructor(colors: UIColor[], maxVelocity: number) {
    super();

    if (colors.length === 0) {
      throw new Error("UIRenderingColorOverVelocity: colors array cannot be empty");
    }

    if (maxVelocity <= 0) {
      throw new Error("UIRenderingColorOverVelocity: maxVelocity must be greater than 0");
    }

    this.source = source.replace(
      "COLOR_OVER_VELOCITY_MAX",
      `COLOR_OVER_VELOCITY_MAX ${maxVelocity.toFixed(2)}`,
    );

    this.requiredUniforms = { colorOverVelocityTexture: buildGradientTexture(colors) } as const;
  }

  public override destroy(): void {
    (this.requiredUniforms.colorOverVelocityTexture as DataTexture).dispose();
  }
}

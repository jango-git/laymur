import type { DataTexture } from "three";
import type { UIColor } from "../../core";
import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared";
import { buildGradientTexture } from "../miscellaneous/miscellaneous";
import source from "../shaders/UIRenderingColorOverLife.glsl";
import { UIRenderingModule } from "./UIRenderingModule";

export class UIRenderingColorOverLife extends UIRenderingModule {
  /** @internal */
  public override readonly requiredProperties: Record<string, UIPropertyName> = {
    builtin: "Matrix4",
  } as const;
  /** @internal */
  public readonly requiredUniforms: Record<string, UIProperty>;
  /** @internal */
  public readonly source = source;

  constructor(colors: UIColor[]) {
    super();

    if (colors.length === 0) {
      throw new Error("UIRenderingColorOverLife: colors array cannot be empty");
    }

    this.requiredUniforms = { colorOverLifeTexture: buildGradientTexture(colors) };
  }

  public override destroy(): void {
    (this.requiredUniforms.colorOverLifeTexture as DataTexture).dispose();
  }
}

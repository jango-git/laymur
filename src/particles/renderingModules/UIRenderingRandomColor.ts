import type { DataTexture } from "three";

import type { UIColor } from "../../core/index.js";
import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared.js";
import { buildGradientTexture } from "../miscellaneous/miscellaneous.js";
import { buildRandomColorSource } from "../shaders/UIRenderingRandomColor.js";
import { UIRenderingModule } from "./UIRenderingModule.js";

/**
 * Colors each particle with one color of a palette, picked at random for its whole life.
 *
 * The palette is one texture, read at the texel center, so the number of colors costs no
 * uniforms.
 */
export class UIRenderingRandomColor extends UIRenderingModule {
  public override readonly requiredProperties: Record<string, UIPropertyName> = {
    builtin: "Matrix4",
  };
  public readonly requiredUniforms: Record<string, UIProperty>;
  public readonly source: string;

  /**
   * @param colors - Palette to pick from
   */
  constructor(colors: UIColor[]) {
    super();

    if (colors.length === 0) {
      throw new Error("UIRenderingRandomColor.constructor.colors: colors array cannot be empty");
    }

    this.requiredUniforms = { paletteTexture: buildGradientTexture(colors) };
    this.source = buildRandomColorSource(colors.length);
  }

  public override destroy(): void {
    (this.requiredUniforms.paletteTexture as DataTexture).dispose();
  }
}

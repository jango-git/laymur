import {
  ClampToEdgeWrapping,
  DataTexture,
  LinearFilter,
  RGBAFormat,
  SRGBColorSpace,
  UnsignedByteType,
  UVMapping,
} from "three";
import type { UIColor } from "../../core";
import type { UIProperty, UIPropertyName } from "../../core/miscellaneous/generic-plane/shared";
import source from "../shaders/UIRenderingColorOverLife.glsl";
import { UIRenderingModule } from "./UIRenderingModule";

export class UIRenderingColorOverLife extends UIRenderingModule {
  /** @internal */
  public override readonly requiredProperties: Record<string, UIPropertyName> = {
    lifetime: "Vector2",
  } as const;
  /** @internal */
  public readonly requiredUniforms: Record<string, UIProperty>;
  /** @internal */
  public readonly source = source;

  constructor(colors: UIColor[]) {
    super();

    if (colors.length === 0) {
      throw new Error("UIColorOverLifeRenderingModule: colors array cannot be empty");
    }

    const texture = this.createGradientTexture(colors);

    this.requiredUniforms = {
      colorOverLifeTexture: texture,
    };
  }

  private createGradientTexture(colors: UIColor[]): DataTexture {
    const width = colors.length;
    const height = 1;
    const data = new Uint8Array(width * height * 4);

    for (let i = 0; i < width; i++) {
      const color = colors[i];

      const index = i * 4;
      data[index] = Math.round(color.r * 255);
      data[index + 1] = Math.round(color.g * 255);
      data[index + 2] = Math.round(color.b * 255);
      data[index + 3] = Math.round(color.a * 255);
    }

    const texture = new DataTexture(
      data,
      width,
      height,
      RGBAFormat,
      UnsignedByteType,
      UVMapping,
      ClampToEdgeWrapping,
      ClampToEdgeWrapping,
      LinearFilter,
      LinearFilter,
      1,
      SRGBColorSpace,
    );
    texture.needsUpdate = true;

    return texture;
  }
}

import type { Texture } from "three";
import { Mesh } from "three";
import type { UILayer } from "../Layers/UILayer";
import { assertSize } from "../Miscellaneous/asserts";
import { renderSymbol } from "../Miscellaneous/symbols";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIProgressMaterial } from "../Passes/UIProgressMaterial";
import { UIElement } from "./UIElement";

export class UIProgress extends UIElement {
  private readonly material: UIProgressMaterial;
  private readonly textureBackground: Texture;
  private readonly textureForeground: Texture;

  constructor(
    layer: UILayer,
    textureBackground: Texture,
    textureForeground: Texture,
  ) {
    const backgroundWidth = textureBackground.image?.width;
    const backgroundHeight = textureBackground.image?.height;

    assertSize(
      backgroundWidth,
      backgroundHeight,
      `Invalid image dimensions - texture "${textureBackground.name || "unnamed"}" has invalid width (${backgroundWidth}) or height (${backgroundHeight}). Image dimensions must be non-zero positive numbers.`,
    );

    const foregroundWidth = textureForeground.image?.width;
    const foregroundHeight = textureForeground.image?.height;

    assertSize(
      foregroundWidth,
      foregroundHeight,
      `Invalid image dimensions - texture "${textureForeground.name || "unnamed"}" has invalid width (${foregroundWidth}) or height (${foregroundHeight}). Image dimensions must be non-zero positive numbers.`,
    );

    const material = new UIProgressMaterial(
      textureBackground,
      textureForeground,
    );
    const object = new Mesh(geometry, material);

    super(layer, object, 0, 0, backgroundWidth, backgroundHeight);

    this.material = material;
    this.textureBackground = textureBackground;
    this.textureForeground = textureForeground;

    this.flushTransform();
  }

  public get background(): Texture {
    return this.textureBackground;
  }

  public get foreground(): Texture {
    return this.textureForeground;
  }

  public get progress(): number {
    return this.material.uniforms.progress.value;
  }

  public set progress(value: number) {
    this.material.uniforms.progress.value = value;
    this.material.uniformsNeedUpdate = true;
  }

  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }

  public [renderSymbol](): void {
    this.flushTransform();

    // this.material.setTexture(
    //   this.composer.render(renderer, this.textureBackground),
    // );
  }
}

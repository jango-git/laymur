import type { Color, Texture, WebGLRenderer } from "three";
import { Mesh } from "three";
import type { UILayer } from "../Layers/UILayer";
import { assertSize } from "../Miscellaneous/asserts";
import { renderSymbol } from "../Miscellaneous/symbols";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIMaterial } from "../Passes/UIMaterial";
import { UIElement } from "./UIElement";

export class UIImage extends UIElement {
  private readonly material: UIMaterial;
  private readonly texture: Texture;

  constructor(layer: UILayer, texture: Texture) {
    const width = texture.image?.width;
    const height = texture.image?.height;

    assertSize(
      width,
      height,
      `Invalid image dimensions - texture "${texture.name || "unnamed"}" has invalid width (${width}) or height (${height}). Image dimensions must be non-zero positive numbers.`,
    );

    const material = new UIMaterial(texture);
    const object = new Mesh(geometry, material);

    super(layer, object, 0, 0, width, height);

    this.material = material;
    this.texture = texture;

    this.flushTransform();
  }

  public get color(): Color {
    return this.material.color;
  }

  public get opacity(): number {
    return this.material.opacity;
  }

  public set color(value: Color) {
    this.material.color = value;
  }

  public set opacity(value: number) {
    this.material.opacity = value;
  }

  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }

  public [renderSymbol](renderer: WebGLRenderer): void {
    this.flushTransform();
    this.material.map = this.composer.render(renderer, this.texture);
  }
}

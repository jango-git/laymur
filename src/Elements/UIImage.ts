import type { Texture, WebGLRenderer } from "three";
import { Mesh } from "three";
import type { UILayer } from "../Layers/UILayer";
import { UIMaterial } from "../Materials/UIMaterial";
import { assertSize } from "../Miscellaneous/asserts";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

export class UIImage extends UIElement {
  private readonly material: UIMaterial;
  private readonly textureInternal: Texture;

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
    this.textureInternal = texture;

    this.applyTransformations();
  }

  public get texture(): Texture {
    return this.textureInternal;
  }

  public get color(): number {
    return this.material.getColor();
  }

  public get opacity(): number {
    return this.material.getOpacity();
  }

  public set color(value: number) {
    this.material.setColor(value);
    this.composerInternal.requestUpdate();
  }

  public set opacity(value: number) {
    this.material.setOpacity(value);
    this.composerInternal.requestUpdate();
  }

  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }

  protected override render(renderer: WebGLRenderer): void {
    (this.object as Mesh).material = this.composerInternal.compose(
      renderer,
      this.textureInternal.image.width,
      this.textureInternal.image.height,
      this.material,
    );
    this.applyTransformations();
  }
}

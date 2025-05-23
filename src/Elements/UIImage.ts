import type { Texture } from "three";
import { Mesh } from "three";
import type { UILayer } from "../Layers/UILayer";
import { UIEnhancedMaterial } from "../Materials/UIEnhancedMaterial";
import { assertSize } from "../Miscellaneous/asserts";
import { flushTransformSymbol } from "../Miscellaneous/symbols";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

export class UIImage extends UIElement {
  public readonly material: UIEnhancedMaterial;

  constructor(layer: UILayer, texture: Texture) {
    const width = texture.image?.width;
    const height = texture.image?.height;

    assertSize(
      width,
      height,
      `Invalid image dimensions - texture "${texture.name || "unnamed"}" has invalid width (${width}) or height (${height}). Image dimensions must be non-zero positive numbers.`,
    );

    const material = new UIEnhancedMaterial(texture);
    const object = new Mesh(geometry, material);

    super(layer, object, 0, 0, width, height);

    this.material = material;
    this[flushTransformSymbol]();
  }

  public override destroy(): void {
    this.material.dispose();
    super.destroy();
  }
}

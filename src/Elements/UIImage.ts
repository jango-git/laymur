import type { Texture } from "three";
import { FrontSide, Mesh, MeshBasicMaterial } from "three";
import type { UILayer } from "../Layers/UILayer";
import { assertSize } from "../Miscellaneous/asserts";
import { applyMicroTransformations } from "../Miscellaneous/microTransformationTools";
import { readMicroSymbol, readVariablesSymbol } from "../Miscellaneous/symbols";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

export class UIImage extends UIElement {
  constructor(layer: UILayer, texture: Texture) {
    const width = texture.image?.width;
    const height = texture.image?.height;

    assertSize(
      width,
      height,
      `Invalid image dimensions - texture "${texture.name || "unnamed"}" has invalid width (${width}) or height (${height}). Image dimensions must be non-zero positive numbers.`,
    );

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: FrontSide,
    });

    const object = new Mesh(geometry, material);
    super(layer, object, 0, 0, width, height);

    this[readVariablesSymbol]();
  }

  public [readVariablesSymbol](): void {
    applyMicroTransformations(
      this.object,
      this.micro,
      this.x,
      this.y,
      this.width,
      this.height,
    );
  }

  public [readMicroSymbol](): void {
    this[readVariablesSymbol]();
  }
}

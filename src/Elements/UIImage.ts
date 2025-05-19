import { DoubleSide, Mesh, MeshBasicMaterial, Texture } from "three";
import { UILayer } from "../Layers/UILayer";
import { assertSize } from "../Miscellaneous/asserts";
import { applyMicroTransformations } from "../Miscellaneous/microTransformationTools";
import {
  addElementSymbol,
  readMicroSymbol,
  readVariablesSymbol,
  removeElementSymbol,
} from "../Miscellaneous/symbols";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

export class UIImage extends UIElement {
  protected readonly object: Mesh;

  public constructor(layer: UILayer, texture: Texture) {
    const width = texture.image?.width;
    const height = texture.image?.height;

    assertSize(
      width,
      height,
      `Invalid image dimensions - texture "${texture.name || "unnamed"}" has invalid width (${width}) or height (${height}). Image dimensions must be non-zero positive numbers.`,
    );

    super(layer, 0, 0, width, height);

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
    });

    this.object = new Mesh(geometry, material);

    this.layer[addElementSymbol](this, this.object);
    this[readVariablesSymbol]();
  }

  public destroy(): void {
    super.destroy();
    this.layer[removeElementSymbol](this, this.object);
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

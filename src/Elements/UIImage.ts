import { DoubleSide, Mesh, MeshBasicMaterial, Texture } from "three";
import { UILayer } from "../Layers/UILayer";
import {
  addElement,
  layerSymbol,
  readVariablesSymbol,
  removeElement,
} from "../Miscellaneous/symbols";
import { geometry } from "../Miscellaneous/threeInstances";
import { UIElement } from "./UIElement";

export class UIImage extends UIElement {
  private readonly object: Mesh;

  public constructor(layer: UILayer, texture: Texture) {
    const width = texture.image?.width;
    const height = texture.image?.height;

    if (!width || !height) {
      throw new Error("Invalid width/height");
    }

    super(layer, 0, 0, width, height);

    const material = new MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: DoubleSide,
    });
    this.object = new Mesh(geometry, material);

    this[layerSymbol][addElement](this, this.object);
    this[readVariablesSymbol]();
  }

  public destroy(): void {
    this[layerSymbol][removeElement](this, this.object);
  }

  [readVariablesSymbol](): void {
    this.object.position.x = this.x;
    this.object.position.y = this.y;
    this.object.scale.x = this.width;
    this.object.scale.y = this.height;
  }
}

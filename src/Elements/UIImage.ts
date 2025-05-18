import { DoubleSide, Mesh, MeshBasicMaterial, Texture } from "three";
import { UILayer } from "../Layers/UILayer";
import { applyMicroTransformations } from "../Miscellaneous/microTransformationTools";
import {
  addElement,
  layerSymbol,
  readMicroSymbol,
  readVariablesSymbol,
  removeElement,
} from "../Miscellaneous/symbols";
import { geometry } from "../Miscellaneous/threeInstances";
import {
  UIMicroTransformable,
  UIMicroTransformations,
} from "../Miscellaneous/UIMicroTransformations";
import { UIElement } from "./UIElement";

export class UIImage extends UIElement implements UIMicroTransformable {
  public readonly micro: UIMicroTransformations;
  private readonly object: Mesh;

  public constructor(layer: UILayer, texture: Texture) {
    const width = texture.image?.width;
    const height = texture.image?.height;

    if (!width || !height) {
      throw new Error("Invalid width/height");
    }

    super(layer, 0, 0, width, height);
    this.micro = new UIMicroTransformations(this);

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
    applyMicroTransformations(
      this.object,
      this.micro,
      this.x,
      this.y,
      this.width,
      this.height,
    );
  }

  [readMicroSymbol](): void {
    this[readVariablesSymbol]();
  }
}

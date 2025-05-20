import { Object3D } from "three";
import type { UILayer } from "../Layers/UILayer";
import { applyMicroTransformations } from "../Miscellaneous/microTransformationTools";
import { readMicroSymbol, readVariablesSymbol } from "../Miscellaneous/symbols";
import { UIElement } from "./UIElement";

const DEFAULT_DUMMY_SIZE = 100;

export class UIDummy extends UIElement {
  constructor(
    layer: UILayer,
    width = DEFAULT_DUMMY_SIZE,
    height = DEFAULT_DUMMY_SIZE,
  ) {
    super(layer, new Object3D(), 0, 0, width, height);
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

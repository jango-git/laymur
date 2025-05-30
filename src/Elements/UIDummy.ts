import { Object3D } from "three";
import type { UILayer } from "../Layers/UILayer";
import { renderSymbol } from "../Miscellaneous/symbols";
import { UIElement } from "./UIElement";

const DEFAULT_DUMMY_SIZE = 1000;

export class UIDummy extends UIElement {
  constructor(
    layer: UILayer,
    width = DEFAULT_DUMMY_SIZE,
    height = DEFAULT_DUMMY_SIZE,
  ) {
    super(layer, new Object3D(), 0, 0, width, height);
    this.flushTransform();
  }

  public override [renderSymbol](): void {
    this.flushTransform();
  }
}

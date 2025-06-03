import { Object3D } from "three";
import type { UILayer } from "../Layers/UILayer";
import { UIElement } from "./UIElement";

const DEFAULT_DUMMY_SIZE = 100;

export class UIDummy extends UIElement {
  constructor(
    layer: UILayer,
    width = DEFAULT_DUMMY_SIZE,
    height = DEFAULT_DUMMY_SIZE,
  ) {
    super(layer, new Object3D(), 0, 0, width, height);
    this.applyTransformations();
  }

  protected override render(): void {
    this.applyTransformations();
  }
}

import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";
import { layerSymbol } from "./symbols";

export function assertSameLayer(
  elementOne: UIElement | UILayer,
  elementTwo: UIElement,
): void {
  if (
    (elementOne instanceof UILayer ? elementOne : elementOne[layerSymbol]) !==
    elementTwo[layerSymbol]
  ) {
    throw new Error("Elements must be on the same layer");
  }
}

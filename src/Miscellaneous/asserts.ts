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
    throw new Error(`Elements must be on the same layer - element "${elementTwo.constructor.name}" cannot interact with elements from a different layer`);
  }
}

export function assertSize(width: number, height: number): void {
  if (width <= 0 || height <= 0) {
    throw new Error(`Invalid dimensions: width (${width}) and height (${height}) must both be positive numbers greater than 0`);
  }
}

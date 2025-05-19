import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";

export function assertSameLayer(
  elementOne: UIElement | UILayer,
  elementTwo: UIElement,
  message?: string,
): void {
  if (
    (elementOne instanceof UILayer ? elementOne : elementOne.layer) !==
    elementTwo.layer
  ) {
    throw new Error(
      message ??
        `Elements must be on the same layer - element "${elementTwo.constructor.name}" cannot interact with elements from a different layer`,
    );
  }
}

export function assertSize(
  width: number,
  height: number,
  message?: string,
): void {
  if (width <= 0 || height <= 0) {
    throw new Error(
      message ??
        `Invalid dimensions: width (${width}) and height (${height}) must both be positive numbers greater than 0`,
    );
  }
}

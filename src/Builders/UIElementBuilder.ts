import { UIElement } from "../Elements/UIElement";
import { UIImage } from "../Elements/UIImage";
import { UIText } from "../Elements/UIText";
import { UILayer } from "../Layers/UILayer";
import {
  isUIImageDescription,
  isUITextDescription,
  isUITextEnhancedDescription,
  UIAnyElementDescription,
} from "./UIElementBuilderInterfaces";

export class UIElementBuilder {
  public static fromDescription(
    layer: UILayer,
    description:
      | Map<string, UIAnyElementDescription>
      | Record<string, UIAnyElementDescription>,
  ): Map<string, UIElement> {
    const entries =
      description instanceof Map
        ? description.entries()
        : Object.entries(description);
    const elements = new Map<string, UIElement>();

    for (const [key, value] of entries) {
      if (elements.has(key)) throw new Error("Element already exists");
      let element: UIElement;

      if (isUIImageDescription(value)) {
        element = new UIImage(layer, value.texture);
      } else if (isUITextDescription(value)) {
        element = new UIText(layer, [value.text], {
          defaultStyle: value.style,
        });
      } else if (isUITextEnhancedDescription(value)) {
        element = new UIText(layer, value.spans, {
          defaultStyle: value.defaultStyle,
        });
      } else {
        throw new Error("Unknown ui element type");
      }

      elements.set(key, element);
    }

    return elements;
  }
}

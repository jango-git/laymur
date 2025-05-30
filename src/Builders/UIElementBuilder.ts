import { Texture } from "three";
import { UIDummy } from "../Elements/UIDummy";
import type { UIElement } from "../Elements/UIElement";
import { UIImage } from "../Elements/UIImage";
import { UIProgress } from "../Elements/UIProgress";
import { UIText } from "../Elements/UIText";
import type { UILayer } from "../Layers/UILayer";
import type { UIAnyElementDescription } from "./UIElementBuilderInterfaces";
import {
  isUIDummyDescription,
  isUIImageDescription,
  isUIProgressDescription,
  isUITextDescription,
  isUITextMultiSpanDescription,
} from "./UIElementBuilderInterfaces";

export class UIElementBuilder {
  public static fromDescription(
    layer: UILayer,
    description:
      | Map<string, UIAnyElementDescription | Texture | String>
      | Record<string, UIAnyElementDescription | Texture | String>,
  ): Record<string, UIElement> {
    const entries =
      description instanceof Map
        ? description.entries()
        : Object.entries(description);
    const elements = new Map<string, UIElement>();

    for (const [key, value] of entries) {
      if (elements.has(key)) {
        throw new Error(
          `Duplicate element key "${key}" - each UI element must have a unique identifier`,
        );
      }
      let element: UIElement;

      if (value instanceof Texture) {
        element = new UIImage(layer, value);
      } else if (isUIImageDescription(value)) {
        element = new UIImage(layer, value.texture);
      } else if (typeof value === "string") {
        element = new UIText(layer, [value]);
      } else if (isUIProgressDescription(value)) {
        element = new UIProgress(layer, value.background, value.foreground);
      } else if (isUITextDescription(value)) {
        element = new UIText(layer, [value.text], {
          defaultStyle: value.style,
        });
      } else if (isUITextMultiSpanDescription(value)) {
        element = new UIText(layer, value.spans, {
          defaultStyle: value.defaultStyle,
        });
      } else if (isUIDummyDescription(value)) {
        element = new UIDummy(layer, value.width, value.height);
      } else {
        throw new Error(
          `Invalid UI element type for "${key}". Expected one of: Texture, UIImage, String, UITextDescription, or UITextEnhancedDescription`,
        );
      }

      elements.set(key, element);
    }

    return Object.fromEntries(elements);
  }
}

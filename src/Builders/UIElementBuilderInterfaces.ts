import { Texture } from "three";
import {
  isUITextSpan,
  UITextSpan,
  UITextStyle,
} from "../Elements/UITextInterfaces";

export interface UIImageDescription {
  texture: Texture;
}

export interface UITextDescription {
  text: string;
  style?: Partial<UITextStyle>;
}

export interface UITextEnancedDescription {
  spans: (UITextSpan | string)[];
  defaultStyle?: Partial<UITextStyle>;
}

export type UIAnyElementDescription =
  | UIImageDescription
  | UITextDescription
  | UITextEnancedDescription;

export function isUIImageDescription(obj?: unknown): obj is UIImageDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "texture" in obj &&
    obj.texture instanceof Texture
  );
}

export function isUITextDescription(obj?: unknown): obj is UITextDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "text" in obj &&
    typeof obj.text === "string"
  );
}

export function isUITextEnhancedDescription(
  obj?: unknown,
): obj is UITextEnancedDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "spans" in obj &&
    Array.isArray(obj.spans) &&
    obj.spans.every((span) => typeof span === "string" || isUITextSpan(span))
  );
}

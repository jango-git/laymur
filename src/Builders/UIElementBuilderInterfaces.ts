import { Texture } from "three";
import type { UITextSpan, UITextStyle } from "../Elements/UITextInterfaces";
import { isUITextSpan } from "../Elements/UITextInterfaces";

export interface UIImageDescription {
  texture: Texture;
}

export interface UIProgressDescription {
  background: Texture;
  foreground: Texture;
}

export interface UITextDescription {
  text: string;
  style?: Partial<UITextStyle>;
}

export interface UITextMultiSpanDescription {
  spans: (UITextSpan | string)[];
  defaultStyle?: Partial<UITextStyle>;
}

export interface UIDummyDescription {
  width?: number;
  height?: number;
}

export type UIAnyElementDescription =
  | UIImageDescription
  | UIProgressDescription
  | UITextDescription
  | UITextMultiSpanDescription
  | UIDummyDescription;

export function isUIImageDescription(obj: unknown): obj is UIImageDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "texture" in obj &&
    obj.texture instanceof Texture
  );
}

export function isUIProgressDescription(
  obj: unknown,
): obj is UIProgressDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "background" in obj &&
    obj.background instanceof Texture &&
    "foreground" in obj &&
    obj.foreground instanceof Texture
  );
}

export function isUITextDescription(obj: unknown): obj is UITextDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "text" in obj &&
    typeof obj.text === "string"
  );
}

export function isUITextMultiSpanDescription(
  obj: unknown,
): obj is UITextMultiSpanDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "spans" in obj &&
    Array.isArray(obj.spans) &&
    obj.spans.every((span) => typeof span === "string" || isUITextSpan(span))
  );
}

export function isUIDummyDescription(obj: unknown): obj is UIDummyDescription {
  return (
    obj !== null &&
    typeof obj === "object" &&
    (!("width" in obj) || typeof obj.width === "number") &&
    (!("height" in obj) || typeof obj.height === "number")
  );
}

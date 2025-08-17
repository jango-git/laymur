import { isUITextStyle, type UITextStyle } from "./UITextStyle";

export interface UITextSpan {
  text: string;
  style?: Partial<UITextStyle>;
}

export function isUITextSpan(obj?: unknown): obj is UITextSpan {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "text" in obj &&
    typeof obj.text === "string" &&
    (!("style" in obj) || isUITextStyle(obj.style))
  );
}

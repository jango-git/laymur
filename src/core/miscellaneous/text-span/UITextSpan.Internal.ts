import type { UITextStyleConfig } from "../text-style/UITextStyle.Internal.js";

/** Configuration for creating a text span */
export interface UITextSpanConfig {
  /** Text content */
  text: string;
  /** Style properties */
  style?: Partial<UITextStyleConfig>;
}

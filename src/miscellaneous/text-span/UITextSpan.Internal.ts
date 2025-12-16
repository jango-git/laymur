import type { UITextStyleConfig } from "../text-style/UITextStyle.Internal";

/** Configuration for creating a text span */
export interface UITextSpanConfig {
  /** Text content */
  text: string;
  /** Style properties */
  style?: Partial<UITextStyleConfig>;
}

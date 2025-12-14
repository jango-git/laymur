import type { UITextStyleConfig } from "../text-style/UITextStyle.Internal";

export interface UITextSpanConfig {
  text: string;
  style?: Partial<UITextStyleConfig>;
}

import type { UITextSpanConfig } from "./text-span/UITextSpan.Internal";
import type { UITextStyleConfig } from "./text-style/UITextStyle.Internal";

export type UITextContent =
  | (UITextSpanConfig | string)[]
  | UITextSpanConfig
  | string;
export interface UITextSize {
  width: number;
  height: number;
}

export interface UIChunkMetrics extends UITextSize {
  baseline: number;
  lineHeight: number;
}

export interface UITextChunk {
  text: string;
  style: UITextStyleConfig;
  metrics: UIChunkMetrics;
}

export interface UITextLine extends UIChunkMetrics {
  chunks: UITextChunk[];
}

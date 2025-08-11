import type { UITextSpan } from "./UITextSpan";
import type { UITextStyle } from "./UITextStyle";

export type UITextContent = (UITextSpan | string)[] | UITextSpan | string;

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
  style: UITextStyle;
  metrics: UIChunkMetrics;
}

export interface UITextLine extends UIChunkMetrics {
  chunks: UITextChunk[];
}

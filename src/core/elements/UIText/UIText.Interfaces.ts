import type { UITextSpanConfig } from "../../miscellaneous/text-span/UITextSpan.Internal";
import type { UITextStyleConfig } from "../../miscellaneous/text-style/UITextStyle.Internal";

/** Text content configuration */
export type UITextContent = (UITextSpanConfig | string)[] | UITextSpanConfig | string;

/** Text dimensions */
export interface UITextSize {
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

/** Text chunk metrics */
export interface UIChunkMetrics extends UITextSize {
  /** Baseline offset from top in pixels */
  baseline: number;
  /** Line height in pixels */
  lineHeight: number;
}

/** Styled text chunk */
export interface UITextChunk {
  /** Text content */
  text: string;
  /** Resolved style */
  style: UITextStyleConfig;
  /** Chunk metrics */
  metrics: UIChunkMetrics;
}

/** Line of text chunks */
export interface UITextLine extends UIChunkMetrics {
  /** Chunks in this line */
  chunks: UITextChunk[];
}

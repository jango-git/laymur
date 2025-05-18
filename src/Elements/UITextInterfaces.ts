export interface UITextStyle {
  color: string;
  fontFamily: string;
  fontSize: number;
  fontStyle: "normal" | "italic" | "oblique";
  fontWeight: "normal" | "bold" | "bolder" | "lighter" | number;
  lineHeight: number;

  enableShadow: boolean;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowBlur: number;
  shadowColor: string;

  enableStroke: boolean;
  strokeColor: string;
  strokeWidth: number;
}

export interface UITextPadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface UITextSize {
  width: number;
  height: number;
}

export interface UIChunkMetrics {
  width: number;
  height: number;
  baseline: number;
  lineHeight: number;
}

export interface UITextChunk {
  text: string;
  style: UITextStyle;
  metrics: UIChunkMetrics;
}

export interface UITextLine {
  chunks: UITextChunk[];
  width: number;
  height: number;
  baseline: number;
  lineHeight: number;
}

export interface UITextSpan {
  text: string;
  style?: Partial<UITextStyle>;
}

export function isUITextSpan(obj?: unknown): obj is UITextSpan {
  return (
    obj !== null &&
    typeof obj === "object" &&
    "text" in obj &&
    typeof obj.text === "string"
  );
}

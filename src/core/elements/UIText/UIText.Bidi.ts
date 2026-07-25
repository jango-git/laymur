import type { UITextSpan } from "../../miscellaneous/text-span/UITextSpan.js";
import type { UITextChunk } from "./UIText.Interfaces.js";

/** No strong directional character */
const BIDI_NEUTRAL = 0;
/** Resolves to left to right */
const BIDI_LTR = 1;
/** Resolves to right to left */
const BIDI_RTL = 2;

/** Hebrew, Arabic, Syriac, Thaana, NKo, Arabic Extended and presentation forms */
const RTL_PATTERN = /[\u0591-\u07FF\u0860-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;
/** Latin, Greek, Cyrillic, Armenian, Indic, South East Asian, CJK, Hangul */
const LTR_PATTERN = /[A-Za-z\u00C0-\u058F\u0900-\u1FFF\u2C00-\uD7FF]/;
/** European digits, laid out left to right inside any paragraph */
const NUMBER_PATTERN = /[0-9]/;

/**
 * Detects the strong directional class of a text.
 * Implements a simplified UAX#9 P2: the first strong character wins.
 * @param text Text to inspect
 * @returns Directional class, neutral when no strong character is present
 */
function detectStrongClass(text: string): number {
  const rtlMatch = RTL_PATTERN.exec(text);
  const ltrMatch = LTR_PATTERN.exec(text);

  if (rtlMatch === null) {
    return ltrMatch === null ? BIDI_NEUTRAL : BIDI_LTR;
  }

  if (ltrMatch === null) {
    return BIDI_RTL;
  }

  return rtlMatch.index < ltrMatch.index ? BIDI_RTL : BIDI_LTR;
}

/**
 * Finds the directional class of the closest non neutral chunk.
 * @param textChunks Chunks of a single line
 * @param index Index to start from
 * @param step Search direction
 * @param fallback Class returned when no strong chunk is found
 * @returns Directional class of the closest strong chunk
 */
function findStrongNeighbourClass(
  textChunks: UITextChunk[],
  index: number,
  step: number,
  fallback: number,
): number {
  for (let i = index; i >= 0 && i < textChunks.length; i += step) {
    if (textChunks[i].bidiClass !== BIDI_NEUTRAL) {
      return textChunks[i].bidiClass;
    }
  }

  return fallback;
}

/**
 * Reverses a closed range of chunks in place.
 * @param textChunks Chunks to modify
 * @param from First index of the range
 * @param to Last index of the range
 */
function reverseChunkRange(textChunks: UITextChunk[], from: number, to: number): void {
  while (from < to) {
    const buffer = textChunks[from];
    textChunks[from] = textChunks[to];
    textChunks[to] = buffer;
    from++;
    to--;
  }
}

/**
 * Detects the directional class used to order a chunk among its neighbours.
 * Digit only chunks are ordered left to right in both paragraph directions.
 * @param text Chunk text
 * @returns Directional class of the chunk
 */
export function detectBidiClass(text: string): number {
  const strongClass = detectStrongClass(text);

  if (strongClass !== BIDI_NEUTRAL) {
    return strongClass;
  }

  return NUMBER_PATTERN.test(text) ? BIDI_LTR : BIDI_NEUTRAL;
}

/**
 * Detects the paragraph direction of the content.
 * Implements a simplified UAX#9 P2/P3: the first strong character of the content wins.
 * @param textSpans Text spans in logical order
 * @returns Whether the paragraph reads right to left
 */
export function detectIsRTL(textSpans: UITextSpan[]): boolean {
  for (const textSpan of textSpans) {
    const strongClass = detectStrongClass(textSpan.text);

    if (strongClass !== BIDI_NEUTRAL) {
      return strongClass === BIDI_RTL;
    }
  }

  return false;
}

/**
 * Reorders chunks from logical order into visual left to right order.
 * Implements UAX#9 L2 at chunk granularity with simplified neutral resolution (N1/N2).
 * Shaping and bidi inside a single chunk are handled by the canvas itself.
 * @param textChunks Chunks of a single line in logical order
 * @param isRTL Whether the paragraph reads right to left
 * @returns Chunks in visual order, or the same array when reordering is not needed
 */
export function reorderChunksVisually(textChunks: UITextChunk[], isRTL: boolean): UITextChunk[] {
  if (!isRTL && !textChunks.some((textChunk) => textChunk.bidiClass === BIDI_RTL)) {
    return textChunks;
  }

  const baseClass = isRTL ? BIDI_RTL : BIDI_LTR;
  const levels: number[] = [];
  let maxLevel = 0;

  for (let i = 0; i < textChunks.length; i++) {
    let bidiClass = textChunks[i].bidiClass;

    if (bidiClass === BIDI_NEUTRAL) {
      const beforeClass = findStrongNeighbourClass(textChunks, i - 1, -1, baseClass);
      const afterClass = findStrongNeighbourClass(textChunks, i + 1, 1, baseClass);
      bidiClass = beforeClass === afterClass ? beforeClass : baseClass;
    }

    const level = bidiClass === BIDI_RTL ? 1 : isRTL ? 2 : 0;
    levels.push(level);
    maxLevel = Math.max(maxLevel, level);
  }

  const result = textChunks.slice();

  for (let level = maxLevel; level >= 1; level--) {
    let start = -1;

    for (let i = 0; i <= levels.length; i++) {
      if (i < levels.length && levels[i] >= level) {
        if (start === -1) {
          start = i;
        }
      } else if (start !== -1) {
        reverseChunkRange(result, start, i - 1);
        start = -1;
      }
    }
  }

  return result;
}

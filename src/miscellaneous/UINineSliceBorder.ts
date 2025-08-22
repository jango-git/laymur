const DEFAULT_SLICE_BORDER = 0.25;

export type UINineSliceBorders =
  | { left: number; right: number; top: number; bottom: number }
  | { horizontal: number; vertical: number }
  | number;

/**
 * Resolves various nine-slice border inputs into a normalized border object.
 *
 * @param value - The border value to resolve (can be number, partial object, or full object)
 * @returns Normalized border object with left, right, top, bottom properties
 */
export function resolveNineSliceBorders(value: unknown): {
  l: number;
  r: number;
  t: number;
  b: number;
} {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return {
      l: DEFAULT_SLICE_BORDER,
      r: DEFAULT_SLICE_BORDER,
      t: DEFAULT_SLICE_BORDER,
      b: DEFAULT_SLICE_BORDER,
    };
  }

  // Handle number
  if (typeof value === "number") {
    return {
      l: value,
      r: value,
      t: value,
      b: value,
    };
  }

  // Handle object
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;

    // Handle { horizontal, vertical } format
    if ("horizontal" in obj && "vertical" in obj) {
      const horizontal =
        typeof obj.horizontal === "number"
          ? obj.horizontal
          : DEFAULT_SLICE_BORDER;
      const vertical =
        typeof obj.vertical === "number" ? obj.vertical : DEFAULT_SLICE_BORDER;

      return {
        l: horizontal,
        r: horizontal,
        t: vertical,
        b: vertical,
      };
    }

    // Handle { left, right, top, bottom } format
    const left = typeof obj.left === "number" ? obj.left : DEFAULT_SLICE_BORDER;
    const right =
      typeof obj.right === "number" ? obj.right : DEFAULT_SLICE_BORDER;
    const top = typeof obj.top === "number" ? obj.top : DEFAULT_SLICE_BORDER;
    const bottom =
      typeof obj.bottom === "number" ? obj.bottom : DEFAULT_SLICE_BORDER;

    return { l: left, r: right, t: top, b: bottom };
  }

  // Fallback to default
  return {
    l: DEFAULT_SLICE_BORDER,
    r: DEFAULT_SLICE_BORDER,
    t: DEFAULT_SLICE_BORDER,
    b: DEFAULT_SLICE_BORDER,
  };
}

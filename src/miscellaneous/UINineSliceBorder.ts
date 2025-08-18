const DEFAULT_SLICE_BORDER = 0.25;

export type UINineSliceBorder =
  | { left: number; right: number; top: number; bottom: number }
  | { horizontal: number; vertical: number }
  | number;

/**
 * Resolves various nine-slice border inputs into a normalized border object.
 *
 * @param value - The border value to resolve (can be number, partial object, or full object)
 * @returns Normalized border object with left, right, top, bottom properties
 */
export function resolveNineSliceBorder(value: unknown): {
  left: number;
  right: number;
  top: number;
  bottom: number;
} {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return {
      left: DEFAULT_SLICE_BORDER,
      right: DEFAULT_SLICE_BORDER,
      top: DEFAULT_SLICE_BORDER,
      bottom: DEFAULT_SLICE_BORDER,
    };
  }

  // Handle number
  if (typeof value === "number") {
    return {
      left: value,
      right: value,
      top: value,
      bottom: value,
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
        left: horizontal,
        right: horizontal,
        top: vertical,
        bottom: vertical,
      };
    }

    // Handle { left, right, top, bottom } format
    const left = typeof obj.left === "number" ? obj.left : DEFAULT_SLICE_BORDER;
    const right =
      typeof obj.right === "number" ? obj.right : DEFAULT_SLICE_BORDER;
    const top = typeof obj.top === "number" ? obj.top : DEFAULT_SLICE_BORDER;
    const bottom =
      typeof obj.bottom === "number" ? obj.bottom : DEFAULT_SLICE_BORDER;

    return { left, right, top, bottom };
  }

  // Fallback to default
  return {
    left: DEFAULT_SLICE_BORDER,
    right: DEFAULT_SLICE_BORDER,
    top: DEFAULT_SLICE_BORDER,
    bottom: DEFAULT_SLICE_BORDER,
  };
}

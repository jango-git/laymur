/** Padding configuration as number, per-side, or per-axis */
export type UIInsetsConfig =
  | { horizontal: number; vertical: number }
  | { left: number; right: number; top: number; bottom: number }
  | number;

export const INSETS_DEFAULT_VALUE = 0;

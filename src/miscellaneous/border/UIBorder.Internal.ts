export type UIBorderConfig =
  | { horizontal: number; vertical: number }
  | { left: number; right: number; top: number; bottom: number }
  | number;

export const BORDER_DEFAULT_VALUE = 0;

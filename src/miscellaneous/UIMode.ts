export enum UIMode {
  HIDDEN = 0,
  VISIBLE = 1,
  INTERACTIVE = 2,
  INTERACTIVE_TRANSPARENT = 3,
}

export function isUIModeInteractive(mode: UIMode): boolean {
  return mode === UIMode.INTERACTIVE || mode === UIMode.INTERACTIVE_TRANSPARENT;
}

export function isUIModeVisible(mode: UIMode): boolean {
  return mode !== UIMode.HIDDEN;
}

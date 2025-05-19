export enum UIOrientation {
  LANDSCAPE,
  PORTRAIT,
  ALWAYS,
}

export function isUIOrientation(obj: unknown): obj is UIOrientation {
  return obj !== null && Object.values(UIOrientation).some((v) => v === obj);
}

export function resolveOrientation(orientation?: UIOrientation): UIOrientation {
  return orientation ?? UIOrientation.ALWAYS;
}

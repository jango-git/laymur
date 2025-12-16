export enum UIOrientation {
  HORIZONTAL = 0,
  VERTICAL = 1,
  ALWAYS = 2,
}

export function resolveOrientation(orientation?: UIOrientation): UIOrientation {
  return orientation ?? UIOrientation.ALWAYS;
}

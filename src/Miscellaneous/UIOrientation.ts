export enum UIOrientation {
  landscape = 1,
  portrait = 2,
  always = 3,
}

export function isUIOrientation(obj: unknown): obj is UIOrientation {
  return obj !== null && Object.values(UIOrientation).some((v) => v === obj);
}

export function resolveOrientation(orientation?: UIOrientation): UIOrientation {
  return orientation ?? UIOrientation.always;
}

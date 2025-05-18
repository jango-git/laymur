export enum UIConstraintOrientation {
  landscape = 1 << 0,
  portrait = 1 << 1,
  always = (1 << 0) | (1 << 1),
}

export function resolveOrientation(
  orientation?: UIConstraintOrientation,
): UIConstraintOrientation {
  return orientation ?? UIConstraintOrientation.always;
}

export function isUIConstraintOrientation(
  obj: unknown,
): obj is UIConstraintOrientation {
  return (
    obj !== null &&
    Object.values(UIConstraintOrientation).some((v) => v === obj)
  );
}

export enum UIConstraintOrientation {
  landscape = 1,
  portrait = 2,
  always = 3,
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

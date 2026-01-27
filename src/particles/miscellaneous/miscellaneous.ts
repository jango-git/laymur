export interface UIRange {
  min: number;
  max: number;
}

export type UIRangeConfig = UIRange | [number, number] | number;

export function resolveUIRangeParameter(parameter: UIRangeConfig): UIRange {
  if (typeof parameter === "number") {
    return { min: parameter, max: parameter };
  }

  if (Array.isArray(parameter)) {
    return { min: parameter[0], max: parameter[1] };
  }

  return parameter;
}

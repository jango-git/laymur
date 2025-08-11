import { UILayer } from "../layers/UILayer";

export const EPSILON = 1e-6;

export interface UILayerElement {
  layer: UILayer;
}

export interface UIPointElement {
  xVariable: number;
  yVariable: number;
}

export interface UIPlaneElement extends UIPointElement {
  wVariable: number;
  hVariable: number;
}

export function isUILayerElement(obj: unknown): obj is UILayerElement {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "layer" in obj &&
    obj.layer instanceof UILayer
  );
}

export function isUIPointElement(obj: unknown): obj is UIPointElement {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "xVariable" in obj &&
    typeof obj.xVariable === "number" &&
    "yVariable" in obj &&
    typeof obj.yVariable === "number"
  );
}

export function isUIPlaneElement(obj: unknown): obj is UIPlaneElement {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "wVariable" in obj &&
    typeof obj.wVariable === "number" &&
    "hVariable" in obj &&
    typeof obj.hVariable === "number"
  );
}

export function assertValidConstraintSubjects(
  a: unknown,
  b: unknown,
  subject: string,
): UILayer {
  if (a instanceof UILayer && b instanceof UILayer) {
    throw new Error(`${subject}: layer cannot be snapped to another layer`);
  }

  let layerA: UILayer;
  let layerB: UILayer;

  if (a instanceof UILayer || isUILayerElement(a)) {
    layerA = a instanceof UILayer ? a : a.layer;
  } else {
    throw new Error(`${subject}: A must be a UILayer or a UIPointElement`);
  }

  if (b instanceof UILayer || isUILayerElement(b)) {
    layerB = b instanceof UILayer ? b : b.layer;
  } else {
    throw new Error(`${subject}: B must be a UILayer or a UIPointElement`);
  }

  if (layerA !== layerB) {
    throw new Error(`${subject}: elements must be on the same layer`);
  }

  return layerA;
}

export function assertValidNumber(value: number, subject: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${subject}: value must be a finite number`);
  }

  if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${subject}: value exceeds maximum safe integer range`);
  }
}

export function assertValidPositiveNumber(
  value: number,
  subject: string,
): void {
  assertValidNumber(value, subject);

  if (value < EPSILON) {
    throw new Error(
      `${subject}: value must be greater than or equal to ${EPSILON}`,
    );
  }
}

export function assertValidNonNegativeNumber(
  value: number,
  subject: string,
): void {
  assertValidNumber(value, subject);
  if (value < 0) {
    throw new Error(`${subject}: value must be greater than or equal to 0`);
  }
}

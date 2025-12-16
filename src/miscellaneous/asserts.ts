import { UILayer } from "../layers/UILayer";

export const EPSILON = 1e-6;

/** Objects that belong to a UI layer */
export interface UILayerElement {
  /** The UI layer containing this element */
  readonly layer: UILayer;
}

/** UI elements with position in 2D space */
export interface UIPointElement {
  /** Solver variable for x coordinate */
  readonly xVariable: number;
  /** Solver variable for y coordinate */
  readonly yVariable: number;

  /** X coordinate in world units */
  readonly x: number;
  /** Y coordinate in world units */
  readonly y: number;
}

/** UI elements with position and dimensions */
export interface UIPlaneElement extends UIPointElement {
  /** Solver variable for width */
  readonly wVariable: number;
  /** Solver variable for height */
  readonly hVariable: number;

  /** Width in world units */
  readonly width: number;
  /** Height in world units */
  readonly height: number;
}

/**
 * Checks if object implements UILayerElement.
 * @param obj Object to check
 * @returns True if object has valid layer property
 */
export function isUILayerElement(obj: unknown): obj is UILayerElement {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "layer" in obj &&
    obj.layer instanceof UILayer
  );
}

/**
 * Checks if object implements UIPointElement.
 * @param obj Object to check
 * @returns True if object has valid position variables
 */
export function isUIPointElement(obj: unknown): obj is UIPointElement {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "xVariable" in obj &&
    typeof obj.xVariable === "number" &&
    "yVariable" in obj &&
    typeof obj.yVariable === "number" &&
    "width" in obj &&
    typeof obj.width === "number" &&
    "height" in obj &&
    typeof obj.height === "number"
  );
}

/**
 * Checks if object implements UIPlaneElement.
 * @param obj Object to check
 * @returns True if object has valid dimension variables
 */
export function isUIPlaneElement(obj: unknown): obj is UIPlaneElement {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "wVariable" in obj &&
    typeof obj.wVariable === "number" &&
    "hVariable" in obj &&
    typeof obj.hVariable === "number" &&
    "width" in obj &&
    typeof obj.width === "number" &&
    "height" in obj &&
    typeof obj.height === "number"
  );
}

/**
 * Validates constraint subjects are from same layer.
 * @param a First constraint subject
 * @param b Second constraint subject
 * @param subject Constraint name for error messages
 * @returns Common layer for both subjects
 * @throws If subjects are invalid or from different layers
 */
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

/**
 * Validates value is finite number within safe range.
 * @param value Number to validate
 * @param subject Value name for error messages
 * @throws If value is not finite or exceeds safe range
 */
export function assertValidNumber(value: number, subject: string): void {
  if (process.env.NODE_ENV !== "production") {
    if (!Number.isFinite(value)) {
      throw new Error(`${subject}: value must be a finite number`);
    }

    if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      throw new Error(`${subject}: value exceeds maximum safe integer range`);
    }
  }
}

/**
 * Validates value is positive (>= EPSILON).
 * @param value Number to validate
 * @param subject Value name for error messages
 * @throws If value is invalid or below EPSILON
 */
export function assertValidPositiveNumber(
  value: number,
  subject: string,
): void {
  if (process.env.NODE_ENV !== "production") {
    assertValidNumber(value, subject);
    if (value < EPSILON) {
      throw new Error(
        `${subject}: value must be greater than or equal to ${EPSILON}`,
      );
    }
  }
}

/**
 * Validates value is non-negative (>= 0).
 * @param value Number to validate
 * @param subject Value name for error messages
 * @throws If value is invalid or negative
 */
export function assertValidNonNegativeNumber(
  value: number,
  subject: string,
): void {
  if (process.env.NODE_ENV !== "production") {
    assertValidNumber(value, subject);
    if (value < 0) {
      throw new Error(`${subject}: value must be greater than or equal to 0`);
    }
  }
}

import { UILayer } from "../layers/UILayer";

/** Small epsilon value for floating-point comparisons and minimum positive number validation. */
export const EPSILON = 1e-6;

/**
 * Interface for objects that belong to a UI layer.
 *
 * Elements implementing this interface are associated with a specific layer
 * for constraint solving and rendering management.
 */
export interface UILayerElement {
  /** The UI layer that contains this element. */
  layer: UILayer;
}

/**
 * Interface for UI elements that have a position in 2D space.
 *
 * Point elements are characterized by x and y coordinates represented
 * as solver variable descriptors for constraint-based positioning.
 */
export interface UIPointElement {
  /** Solver variable descriptor for the x-coordinate. */
  xVariable: number;
  /** Solver variable descriptor for the y-coordinate. */
  yVariable: number;
}

/**
 * Interface for UI elements that have both position and dimensions in 2D space.
 *
 * Plane elements extend point elements with width and height properties,
 * enabling rectangular area constraints and positioning.
 */
export interface UIPlaneElement extends UIPointElement {
  /** Solver variable descriptor for the width dimension. */
  wVariable: number;
  /** Solver variable descriptor for the height dimension. */
  hVariable: number;
}

/**
 * Type guard to check if an object implements the UILayerElement interface.
 *
 * @param obj - The object to check
 * @returns True if the object has a valid layer property, false otherwise
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
 * Type guard to check if an object implements the UIPointElement interface.
 *
 * @param obj - The object to check
 * @returns True if the object has valid xVariable and yVariable properties, false otherwise
 */
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

/**
 * Type guard to check if an object implements the UIPlaneElement interface.
 *
 * Note: This function only checks for width and height variables. Objects
 * should also satisfy UIPointElement requirements for complete validation.
 *
 * @param obj - The object to check
 * @returns True if the object has valid wVariable and hVariable properties, false otherwise
 */
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

/**
 * Validates that two objects are valid constraint subjects from the same layer.
 *
 * Ensures that both objects are either UILayer instances or UILayerElement instances,
 * that they are not both layers (which cannot be constrained to each other),
 * and that they belong to the same layer for constraint solving.
 *
 * @param a - The first constraint subject
 * @param b - The second constraint subject
 * @param subject - The name of the constraint for error messages
 * @returns The common layer that both subjects belong to
 * @throws Will throw an error if subjects are invalid or from different layers
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
 * Validates that a value is a finite number within safe integer range.
 *
 * Checks that the value is finite (not NaN, Infinity, or -Infinity) and
 * within the safe integer range for reliable mathematical operations.
 *
 * @param value - The number to validate
 * @param subject - The name of the value for error messages
 * @throws Will throw an error if the value is not finite or exceeds safe range
 */
export function assertValidNumber(value: number, subject: string): void {
  if (!Number.isFinite(value)) {
    throw new Error(`${subject}: value must be a finite number`);
  }

  if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
    throw new Error(`${subject}: value exceeds maximum safe integer range`);
  }
}

/**
 * Validates that a value is a positive number above the epsilon threshold.
 *
 * First validates that the value is a finite number, then ensures it is
 * greater than or equal to EPSILON to avoid numerical precision issues
 * with very small positive values.
 *
 * @param value - The number to validate
 * @param subject - The name of the value for error messages
 * @throws Will throw an error if the value is invalid or not sufficiently positive
 * @see {@link assertValidNumber}
 */
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

/**
 * Validates that a value is a non-negative number (including zero).
 *
 * First validates that the value is a finite number, then ensures it is
 * greater than or equal to zero. Unlike assertValidPositiveNumber, this
 * function allows zero as a valid value.
 *
 * @param value - The number to validate
 * @param subject - The name of the value for error messages
 * @throws Will throw an error if the value is invalid or negative
 * @see {@link assertValidNumber}
 */
export function assertValidNonNegativeNumber(
  value: number,
  subject: string,
): void {
  assertValidNumber(value, subject);
  if (value < 0) {
    throw new Error(`${subject}: value must be greater than or equal to 0`);
  }
}

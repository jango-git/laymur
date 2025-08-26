import { UILayer } from "../layers/UILayer";

/** Small epsilon value for floating-point comparisons and minimum positive number validation. */
export const EPSILON = 1e-6;

/**
 * Interface for objects that belong to a UI layer.
 *
 * @public
 */
export interface UILayerElement {
  /** The UI layer that contains this element. */
  layer: UILayer;
}

/**
 * Interface for UI elements that have a position in 2D space.
 *
 * Characterized by x and y coordinates represented as solver variable
 * descriptors for constraint-based positioning.
 *
 * @public
 */
export interface UIPointElement {
  /** Solver variable descriptor for the x-coordinate. */
  xVariable: number;
  /** Solver variable descriptor for the y-coordinate. */
  yVariable: number;

  /** The x-coordinate of the element. */
  x: number;
  /** The y-coordinate of the element. */
  y: number;
}

/**
 * Interface for UI elements that have position and dimensions in 2D space.
 *
 * Extends point elements with width and height properties for rectangular
 * area constraints and positioning.
 *
 * @public
 */
export interface UIPlaneElement extends UIPointElement {
  /** Solver variable descriptor for the width dimension. */
  wVariable: number;
  /** Solver variable descriptor for the height dimension. */
  hVariable: number;

  /** The width of the element. */
  width: number;
  /** The height of the element. */
  height: number;
}

/**
 * Type guard to check if an object implements the UILayerElement interface.
 *
 * @param obj - Object to check
 * @returns True if the object has a valid layer property
 * @public
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
 * @param obj - Object to check
 * @returns True if the object has valid xVariable and yVariable properties
 * @public
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
 * Type guard to check if an object implements the UIPlaneElement interface.
 *
 * Note: Only checks for width and height variables. Objects should also
 * satisfy UIPointElement requirements for complete validation.
 *
 * @param obj - Object to check
 * @returns True if the object has valid wVariable and hVariable properties
 * @public
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
 * Validates that two objects are valid constraint subjects from the same layer.
 *
 * Ensures both objects are UILayer or UILayerElement instances, that they are
 * not both layers, and that they belong to the same layer for constraint solving.
 *
 * @param a - First constraint subject
 * @param b - Second constraint subject
 * @param subject - Name of the constraint for error messages
 * @returns Common layer that both subjects belong to
 * @throws Error when subjects are invalid or from different layers
 * @public
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
 * @param value - Number to validate
 * @param subject - Name of the value for error messages
 * @throws Error when the value is not finite or exceeds safe range
 * @public
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
 * Validates that the value is a finite number, then ensures it is greater
 * than or equal to EPSILON to avoid numerical precision issues.
 *
 * @param value - Number to validate
 * @param subject - Name of the value for error messages
 * @throws Error when the value is invalid or not sufficiently positive
 * @public
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
 * Validates that the value is a finite number, then ensures it is greater
 * than or equal to zero. Unlike assertValidPositiveNumber, allows zero.
 *
 * @param value - Number to validate
 * @param subject - Name of the value for error messages
 * @throws Error when the value is invalid or negative
 * @public
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

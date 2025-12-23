import { UILayer } from "../layers/UILayer";
import { isUILayerElement } from "./shared";

export const EPSILON = 1e-6;

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

/**
 * Validates constraint arguments are from same layer.
 * @param a First constraint subject
 * @param b Second constraint subject
 * @param subject Constraint name for error messages
 * @returns Common layer for both subjects
 * @throws If subjects are invalid or from different layers
 */
export function assertValidConstraintArguments(
  a: unknown,
  b: unknown,
  subject: string,
): UILayer {
  if (process.env.NODE_ENV !== "production") {
    if (a instanceof UILayer && b instanceof UILayer) {
      throw new Error(`${subject}: layer cannot be snapped to another layer`);
    }

    let layerA: UILayer;
    let layerB: UILayer;

    if (a instanceof UILayer) {
      layerA = a;
    } else if (isUILayerElement(a)) {
      layerA = a.layer;
    } else {
      throw new Error(`${subject}: A must be a UILayer or a UILayerElement`);
    }

    if (b instanceof UILayer) {
      layerB = b;
    } else if (isUILayerElement(b)) {
      layerB = b.layer;
    } else {
      throw new Error(`${subject}: B must be a UILayer or a UILayerElement`);
    }

    if (layerA !== layerB) {
      throw new Error(`${subject}: elements must be on the same layer`);
    }

    return layerA;
  }

  if (a instanceof UILayer) {
    return a;
  }
  if (isUILayerElement(a)) {
    return a.layer;
  }
  if (b instanceof UILayer) {
    return b;
  }
  if (isUILayerElement(b)) {
    return b.layer;
  }

  throw new Error(`${subject}: no valid subjects found`);
}

/**
 * Validates interpolation constraint subjects.
 * @param subject Constraint name for error messages
 * @param a First element
 * @param b Second element
 * @param c Element to interpolate
 * @param anchorA Anchor on element A
 * @param anchorB Anchor on element B
 * @returns Common layer for all subjects
 * @throws If subjects violate interpolation constraints
 */
export function assertValidInterpolationConstraintArguments(
  subject: string,
  a: unknown,
  b: unknown,
  c: unknown,
  anchorA: number,
  anchorB: number,
): UILayer {
  if (process.env.NODE_ENV !== "production") {
    if (c instanceof UILayer) {
      throw new Error(`${subject}: C cannot be a layer`);
    }

    if (!isUILayerElement(c)) {
      throw new Error(`${subject}: C must be a UILayerElement`);
    }

    let layerA: UILayer;
    let layerB: UILayer;

    if (a instanceof UILayer || isUILayerElement(a)) {
      layerA = a instanceof UILayer ? a : a.layer;
    } else {
      throw new Error(`${subject}: A must be UILayer or UILayerElement`);
    }

    if (b instanceof UILayer || isUILayerElement(b)) {
      layerB = b instanceof UILayer ? b : b.layer;
    } else {
      throw new Error(`${subject}: B must be UILayer or UILayerElement`);
    }

    const layerC = c.layer;

    if (layerA !== layerB || layerA !== layerC) {
      throw new Error(`${subject}: all elements must be on the same layer`);
    }

    if (c === a || c === b) {
      throw new Error(`${subject}: C cannot be equal to A or B`);
    }

    if (a === b) {
      if (Math.abs(anchorA - anchorB) <= EPSILON) {
        throw new Error(
          `${subject}: when A and B are the same, anchorA and anchorB must differ by more than ${EPSILON}`,
        );
      }
    }

    return layerA;
  }

  if (a instanceof UILayer) {
    return a;
  }
  if (isUILayerElement(a)) {
    return a.layer;
  }
  if (b instanceof UILayer) {
    return b;
  }
  if (isUILayerElement(b)) {
    return b.layer;
  }

  throw new Error(`${subject}: no valid subjects found`);
}

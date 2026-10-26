import type { WebGLRenderer } from "three";
import { UILayer } from "../layers/UILayer/UILayer.js";
import { EPSILON } from "./math.js";
import type { UILayerElement } from "./shared.js";
import { isUILayerElement } from "./shared.js";
import type { UIExpression } from "./UIExpression.js";

/**
 * Validates value is finite number within safe range.
 * @param value Number to validate
 * @param subject Value name for error messages
 * @throws If value is not finite or exceeds safe range
 */
export function assertValidNumber(value: number, subject: string): void {
  if (process.env.NODE_ENV !== "production") {
    if (!Number.isFinite(value)) {
      throw new Error(`${subject}: value must be a finite number, got ${value}`);
    }

    if (Math.abs(value) > Number.MAX_SAFE_INTEGER) {
      throw new Error(`${subject}: value exceeds maximum safe integer range, got ${value}`);
    }
  }
}

/**
 * Validates a shader fits the vertex attribute budget of the device. A program over the budget
 * fails to link, which three.js only logs, and its mesh is not drawn.
 * @param renderer Renderer the shader is drawn with
 * @param required Number of vertex attribute locations the shader uses
 * @param subject Value name for error messages
 * @throws If required exceeds the renderer's MAX_VERTEX_ATTRIBS
 */
export function assertVertexAttributeBudget(
  renderer: WebGLRenderer,
  required: number,
  subject: string,
): void {
  if (process.env.NODE_ENV !== "production") {
    const available = renderer.capabilities.maxAttributes;
    if (required > available) {
      throw new Error(
        `${subject}: shader needs ${required} vertex attributes, the device supports ${available}`,
      );
    }
  }
}

/**
 * Validates value is positive (>= EPSILON).
 * @param value Number to validate
 * @param subject Value name for error messages
 * @throws If value is invalid or below EPSILON
 */
export function assertValidPositiveNumber(value: number, subject: string): void {
  if (process.env.NODE_ENV !== "production") {
    assertValidNumber(value, subject);
    if (value < EPSILON) {
      throw new Error(
        `${subject}: value must be greater than or equal to ${EPSILON}, got ${value}`,
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
export function assertValidNonNegativeNumber(value: number, subject: string): void {
  if (process.env.NODE_ENV !== "production") {
    assertValidNumber(value, subject);
    if (value < 0) {
      throw new Error(`${subject}: value must be greater than or equal to 0, got ${value}`);
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
export function assertValidConstraintArguments(a: unknown, b: unknown, subject: string): UILayer {
  if (process.env.NODE_ENV !== "production") {
    assertNotDestroyed(a, "A", subject);
    assertNotDestroyed(b, "B", subject);

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

  throw new Error(`${subject}: A or B must be a UILayer or a UILayerElement`);
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
    assertNotDestroyed(a, "A", subject);
    assertNotDestroyed(b, "B", subject);
    assertNotDestroyed(c, "C", subject);

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
      throw new Error(`${subject}: A must be a UILayer or a UILayerElement`);
    }

    if (b instanceof UILayer || isUILayerElement(b)) {
      layerB = b instanceof UILayer ? b : b.layer;
    } else {
      throw new Error(`${subject}: B must be a UILayer or a UILayerElement`);
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

  if (isUILayerElement(a)) {
    return a.layer;
  }
  if (isUILayerElement(b)) {
    return b.layer;
  }
  if (a instanceof UILayer) {
    return a;
  }
  if (b instanceof UILayer) {
    return b;
  }

  throw new Error(`${subject}: A or B must be a UILayer or a UILayerElement`);
}

/**
 * Validates the element of a single element constraint.
 * @param element Constrained element
 * @param subject Constraint name for error messages
 * @returns Layer of the element
 * @throws If the element is destroyed
 */
export function assertValidConstraintElement(element: UILayerElement, subject: string): UILayer {
  if (process.env.NODE_ENV !== "production") {
    assertNotDestroyed(element, "element", subject);
  }
  return element.layer;
}

/**
 * Validates that the expressions of a custom constraint refer only to existing variables.
 * @param layer Layer of the constraint
 * @param expressions Constraint expressions
 * @param subject Constraint name for error messages
 * @returns The layer
 * @throws If the layer is destroyed or a variable does not exist
 */
export function assertValidConstraintExpressions(
  layer: UILayer,
  expressions: UIExpression[],
  subject: string,
): UILayer {
  if (process.env.NODE_ENV !== "production") {
    assertNotDestroyed(layer, "layer", subject);
    for (const expression of expressions) {
      for (const [variableIndex] of expression.prepareTerms()) {
        if (!layer.solverWrapper.hasVariable(variableIndex)) {
          throw new Error(`${subject}: variable ${variableIndex} does not exist`);
        }
      }
    }
  }
  return layer;
}

/**
 * Validates that a constraint subject is not destroyed. A constraint made with a destroyed
 * subject would stay in the layer without a solver constraint.
 * @param value Element or layer
 * @param name Subject name for error messages
 * @param subject Constraint name for error messages
 * @throws If the subject is destroyed
 */
function assertNotDestroyed(value: unknown, name: string, subject: string): void {
  if (
    typeof value === "object" &&
    value !== null &&
    "destroyed" in value &&
    value.destroyed === true
  ) {
    throw new Error(`${subject}: ${name} is destroyed`);
  }
}

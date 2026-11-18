import type { WebGLRenderer } from "three";

import { EPSILON } from "./math.js";

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
 * Validates a shader fits the varying budget of the device. Like an attribute overflow, a
 * program over the budget fails to link, which three.js only logs, and its mesh is not drawn.
 * @param renderer Renderer the shader is drawn with
 * @param required Number of varying rows (vec4 locations) the shader uses
 * @param subject Value name for error messages
 * @throws If required exceeds the renderer's MAX_VARYING_VECTORS
 */
export function assertVaryingBudget(
  renderer: WebGLRenderer,
  required: number,
  subject: string,
): void {
  if (process.env.NODE_ENV !== "production") {
    const available = renderer.capabilities.maxVaryings;
    if (required > available) {
      throw new Error(
        `${subject}: shader needs ${required} varying vectors, the device supports ${available}`,
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
 * Validates value is within [0, 1].
 * @param value Number to validate
 * @param subject Value name for error messages
 * @throws If value is invalid or outside [0, 1]
 */
export function assertValidUnitNumber(value: number, subject: string): void {
  if (process.env.NODE_ENV !== "production") {
    assertValidNumber(value, subject);
    if (value < 0 || value > 1) {
      throw new Error(`${subject}: value must be between 0 and 1, got ${value}`);
    }
  }
}

/**
 * Validates value is a non-negative integer.
 * @param value Number to validate
 * @param subject Value name for error messages
 * @throws If value is invalid, negative or fractional
 */
export function assertValidNonNegativeInteger(value: number, subject: string): void {
  if (process.env.NODE_ENV !== "production") {
    assertValidNonNegativeNumber(value, subject);
    if (!Number.isInteger(value)) {
      throw new Error(`${subject}: value must be an integer, got ${value}`);
    }
  }
}

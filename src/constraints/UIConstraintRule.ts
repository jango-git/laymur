import { Operator } from "@lume/kiwi";

/**
 * Defines the type of relationship between values in a constraint.
 *
 * Maps directly to Kiwi.js Operators for the constraint solver.
 * Used to specify whether values should be equal, less than, or greater than each other.
 */
export enum UIConstraintRule {
  /**
   * Values must be equal (x = y).
   * Creates an equality constraint in the solver.
   */
  EQUAL = Operator.Eq,

  /**
   * Left value must be less than or equal to right value (x ≤ y).
   * Creates an inequality constraint in the solver.
   */
  LESS = Operator.Le,

  /**
   * Left value must be greater than or equal to right value (x ≥ y).
   * Creates an inequality constraint in the solver.
   */
  GREATER = Operator.Ge,
}

/**
 * Type guard to check if a value is a valid UIConstraintRule.
 *
 * @param obj - The value to check
 * @returns True if the value is a valid UIConstraintRule enum value
 */
export function isUIConstraintRule(obj: unknown): obj is UIConstraintRule {
  return obj !== null && Object.values(UIConstraintRule).some((v) => v === obj);
}

/**
 * Resolves an optional rule to a definite value.
 *
 * @param rule - The constraint rule to resolve, or undefined
 * @returns The provided rule, or EQUAL if none was provided
 */
export function resolveRule(rule?: UIConstraintRule): UIConstraintRule {
  return rule ?? UIConstraintRule.EQUAL;
}

/**
 * Converts a UIConstraintRule to the corresponding Kiwi.js Operator.
 * This function provides a safe way to convert between our enum and Kiwi's enum.
 *
 * @param rule - The constraint rule to convert, or undefined
 * @returns The corresponding Kiwi.js Operator value
 */
export function convertRuleToOperator(rule?: UIConstraintRule): Operator {
  switch (rule) {
    case UIConstraintRule.EQUAL:
      return Operator.Eq;
    case UIConstraintRule.LESS:
      return Operator.Le;
    case UIConstraintRule.GREATER:
      return Operator.Ge;
    default:
      return Operator.Eq;
  }
}

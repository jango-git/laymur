import { Operator } from "@lume/kiwi";

/**
 * Relational operators for UI layout constraints.
 *
 * UIRelation defines the mathematical relationship between the left-hand
 * and right-hand sides of constraint equations. These relations are used
 * by the constraint solver to determine how expressions should be compared
 * when solving layout constraints.
 *
 * @see {@link convertRelation} - Converts to Kiwi solver operators
 */
export enum UIRelation {
  /** Equality relation: left-hand side equals right-hand side. */
  EQUAL = 0,
  /** Less than or equal relation: left-hand side ≤ right-hand side. */
  LESS_THAN = 1,
  /** Greater than or equal relation: left-hand side ≥ right-hand side. */
  GREATER_THAN = 2,
}

/**
 * Converts UIRelation enum values to Kiwi solver operator values.
 *
 * This function maps the UI relation types to the corresponding operators
 * used by the Kiwi constraint solver for mathematical comparisons in
 * constraint equations.
 *
 * @param relation - The UI relation type to convert
 * @returns The corresponding Kiwi solver operator
 * @throws Will throw an error if an invalid relation is provided
 * @see {@link UIRelation} - Relation type definitions
 */
export function convertRelation(relation: UIRelation): Operator {
  switch (relation) {
    case UIRelation.EQUAL:
      return Operator.Eq;
    case UIRelation.LESS_THAN:
      return Operator.Le;
    case UIRelation.GREATER_THAN:
      return Operator.Ge;
    default:
      throw new Error(`Invalid relation: ${relation}`);
  }
}

/**
 * Resolves an optional relation value to a concrete UIRelation.
 *
 * If no relation is provided, returns the default equality relation.
 * This function is commonly used in constraint creation where relation
 * is an optional parameter.
 *
 * @param relation - The optional relation value to resolve
 * @returns The resolved relation, defaulting to EQUAL if undefined
 */
export function resolveRelation(relation?: UIRelation): UIRelation {
  return relation ?? UIRelation.EQUAL;
}

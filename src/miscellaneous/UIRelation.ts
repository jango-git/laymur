import { Operator } from "@lume/kiwi";

/**
 * Relational operators for UI layout constraints.
 *
 * Defines the mathematical relationship between left-hand and right-hand
 * sides of constraint equations. Used by the constraint solver to determine
 * how expressions should be compared.
 *
 * @public
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
 * Maps UI relation types to the corresponding operators used by the
 * Kiwi constraint solver for mathematical comparisons.
 *
 * @param relation - UI relation type to convert
 * @returns Corresponding Kiwi solver operator
 * @throws Error when an invalid relation is provided
 * @public
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
 * Returns the default equality relation if no relation is provided.
 * Used in constraint creation where relation is optional.
 *
 * @param relation - Optional relation value to resolve
 * @returns Resolved relation, defaulting to EQUAL if undefined
 * @public
 */
export function resolveRelation(relation?: UIRelation): UIRelation {
  return relation ?? UIRelation.EQUAL;
}

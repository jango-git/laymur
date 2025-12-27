import { Operator } from "@lume/kiwi";

/** Relational operators for constraints */
export enum UIRelation {
  /** Equality: LHS = RHS */
  EQUAL = 0,
  /** Less than or equal: LHS ≤ RHS */
  LESS_THAN = 1,
  /** Greater than or equal: LHS ≥ RHS */
  GREATER_THAN = 2,
}

/**
 * Converts relation to solver operator.
 * @param relation Relation type
 * @returns Solver operator
 * @throws If relation is invalid
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
      throw new Error(`convertRelation.relation: invalid relation`);
  }
}

/**
 * Resolves optional relation.
 * @param relation Relation to resolve
 * @returns Relation or EQUAL if undefined
 */
export function resolveRelation(relation?: UIRelation): UIRelation {
  return relation ?? UIRelation.EQUAL;
}

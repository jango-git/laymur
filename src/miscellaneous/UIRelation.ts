import { Operator } from "@lume/kiwi";

export enum UIRelation {
  EQUAL,
  LESS_THAN,
  GREATER_THAN,
}

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

export function resolveRelation(relation?: UIRelation): UIRelation {
  return relation ?? UIRelation.EQUAL;
}

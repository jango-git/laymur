import { Operator } from "@lume/kiwi";

export enum UIRelation {
  EQUAL = 0,
  LESS_THAN = 1,
  GREATER_THAN = 2,
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
      throw new Error(`convertRelation: invalid relation`);
  }
}

export function resolveRelation(relation?: UIRelation): UIRelation {
  return relation ?? UIRelation.EQUAL;
}

import { Operator } from "kiwi.js";

export enum UIConstraintRule {
  EQUAL = Operator.Eq,
  LESS = Operator.Le,
  GREATER = Operator.Ge,
}

export function isUIConstraintRule(obj: unknown): obj is UIConstraintRule {
  return obj !== null && Object.values(UIConstraintRule).some((v) => v === obj);
}

export function resolveRule(rule?: UIConstraintRule): UIConstraintRule {
  return rule ?? UIConstraintRule.EQUAL;
}

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

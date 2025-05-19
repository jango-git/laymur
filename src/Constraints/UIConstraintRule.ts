import { Operator } from "kiwi.js";

export enum UIConstraintRule {
  equal = Operator.Eq,
  less = Operator.Le,
  greater = Operator.Ge,
}

export function isUIConstraintRule(obj: unknown): obj is UIConstraintRule {
  return obj !== null && Object.values(UIConstraintRule).some((v) => v === obj);
}

export function resolveRule(rule?: UIConstraintRule): UIConstraintRule {
  return rule ?? UIConstraintRule.equal;
}

export function convertRuleToOperator(rule?: UIConstraintRule): Operator {
  switch (rule) {
    case UIConstraintRule.equal:
      return Operator.Eq;
    case UIConstraintRule.less:
      return Operator.Le;
    case UIConstraintRule.greater:
      return Operator.Ge;
    default:
      return Operator.Eq;
  }
}

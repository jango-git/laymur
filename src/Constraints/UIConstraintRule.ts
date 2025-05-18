import { Operator } from "kiwi.js";

export enum UIConstraintRule {
  equal = Operator.Eq,
  less = Operator.Le,
  greater = Operator.Ge,
}

export function ruleToOperator(rule?: UIConstraintRule): Operator {
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

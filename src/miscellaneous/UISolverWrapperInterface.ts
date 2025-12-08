import type { UIExpression } from "./UIExpression";
import type { UIPriority } from "./UIPriority";
import type { UIRelation } from "./UIRelation";

export interface UISolverWrapperInterface {
  get dirty(): boolean;
  createVariable(value: number, priority: UIPriority): number;
  removeVariable(index: number): void;
  suggestVariableValue(index: number, value: number): void;
  setVariablePriority(index: number, priority: UIPriority): void;
  readVariableValue(index: number): number;
  createConstraint(
    lhs: UIExpression,
    rhs: UIExpression,
    relation: UIRelation,
    priority: UIPriority,
    enabled: boolean,
  ): number;
  removeConstraint(index: number): void;
  setConstraintLHS(index: number, lhs: UIExpression): void;
  setConstraintRHS(index: number, rhs: UIExpression): void;
  setConstraintRelation(index: number, relation: UIRelation): void;
  setConstraintPriority(index: number, priority: UIPriority): void;
  setConstraintEnabled(index: number, enabled: boolean): void;
}

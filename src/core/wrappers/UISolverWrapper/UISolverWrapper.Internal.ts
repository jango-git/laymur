import type { Constraint, Variable } from "@lume/kiwi";
import type { UIExpression } from "../../miscellaneous/UIExpression";
import type { UIPriority } from "../../miscellaneous/UIPriority";
import type { UIRelation } from "../../miscellaneous/UIRelation";

export interface UISolverWrapperView {
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

/**
 * Internal description of a solver variable with its associated properties.
 */
export interface VariableDescription {
  /** The underlying Kiwi variable instance. */
  variable: Variable;
  /** Priority level for constraint solving. */
  priority: UIPriority;
  /** Current suggested value for the variable. */
  value: number;
  /** Optional constraint for P0 priority variables (required variables). */
  constraint?: Constraint;
}

/**
 * Internal description of a solver constraint with its configuration.
 */
export interface ConstraintDescription {
  /** The underlying Kiwi constraint instance. */
  constraint: Constraint;
  /** Left-hand side expression of the constraint. */
  lhs: UIExpression;
  /** Right-hand side expression of the constraint. */
  rhs: UIExpression;
  /** Priority level for constraint solving. */
  priority: UIPriority;
  /** Relational operator (equal, less than, greater than). */
  relation: UIRelation;
  /** Whether the constraint is currently active. */
  enabled: boolean;
}

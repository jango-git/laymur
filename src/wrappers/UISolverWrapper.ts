import { Constraint, Expression, Solver, Variable } from "@lume/kiwi";
import { UIExpression } from "../miscellaneous/UIExpression";
import { convertPriority, UIPriority } from "../miscellaneous/UIPriority";
import { convertRelation, UIRelation } from "../miscellaneous/UIRelation";
import type {
  ConstraintDescription,
  UISolverWrapperInterface,
  VariableDescription,
} from "./UISolverWrapper.Internal";

/**
 * Wrapper around the Kiwi constraint solver providing enhanced UI-specific functionality.
 *
 * UISolverWrapper abstracts the Kiwi (Cassowary) constraint solver to provide a more
 * UI-friendly interface with additional features like dynamic constraint modification,
 * required variables (P0 priority), partial constraint updates, and automatic solver
 * recovery. It manages variables and constraints through index-based references,
 * allowing for easy tracking and modification of layout constraints.
 *
 * Key features:
 * - Index-based variable and constraint management
 * - Required variables with P0 priority (always satisfied)
 * - Dynamic constraint modification without full rebuilds
 * - Automatic solver recovery on constraint conflicts
 * - Lazy evaluation with recalculation flags
 *
 * @see {@link UIExpression} - Expression system for constraint definitions
 * @see {@link UIPriority} - Priority levels for variables and constraints
 * @see {@link UIRelation} - Relational operators for constraints
 */
export class UISolverWrapper implements UISolverWrapperInterface {
  /** @internal */
  public dirty = false;

  /** The underlying Kiwi solver instance, undefined when solver needs rebuilding. */
  private solver? = new Solver();
  /** Flag indicating whether variable values need recalculation. */
  private recalculationRequired = false;

  /** Map of variable indices to their descriptions. */
  private readonly variables = new Map<number, VariableDescription>();
  /** Counter for generating unique variable indices. */
  private lastVariableIndex = 0;

  /** Map of constraint indices to their descriptions. */
  private readonly constraints = new Map<number, ConstraintDescription>();
  /** Counter for generating unique constraint indices. */
  private lastConstraintIndex = 0;

  /**
   * Creates a new solver variable with the specified value and priority.
   *
   * Variables with P0 priority are treated as required (must be satisfied exactly)
   * and are implemented using equality constraints. Other priorities use edit
   * variables that can be adjusted by the solver.
   *
   * @param value - Initial value for the variable
   * @param priority - Priority level for constraint solving
   * @returns Unique index identifier for the created variable
   */
  public createVariable(value: number, priority: UIPriority): number {
    const index = this.lastVariableIndex++;
    const variable = new Variable();

    if (priority === UIPriority.P0) {
      const description: VariableDescription = { variable, priority, value };
      this.variables.set(index, description);

      description.constraint = this.buildConstraint(
        new UIExpression(0, [[index, 1]]),
        new UIExpression(value),
        UIRelation.EQUAL,
        priority,
      );
      try {
        this.solver?.addConstraint(description.constraint);
      } catch {
        this.solver = undefined;
      }
    } else {
      this.variables.set(index, { variable, priority, value });

      try {
        this.solver?.addEditVariable(variable, convertPriority(priority));
        this.solver?.suggestValue(variable, value);
      } catch {
        this.solver = undefined;
      }
    }

    this.recalculationRequired = true;
    this.dirty = true;
    return index;
  }

  /**
   * Removes a variable from the solver system.
   *
   * The variable must not be referenced by any existing constraints.
   * Cleans up both the variable itself and any associated required constraint.
   *
   * @param index - Index of the variable to remove
   * @throws Will throw an error if the variable doesn't exist or is still in use
   */
  public removeVariable(index: number): void {
    const description = this.variables.get(index);
    if (description === undefined) {
      throw new Error(`Variable ${index} does not exist`);
    }

    for (const cDescription of this.constraints.values()) {
      if (cDescription.lhs.hasTerm(index) || cDescription.rhs.hasTerm(index)) {
        throw new Error(`Variable ${index} is used in constraint`);
      }
    }

    try {
      description.constraint
        ? this.solver?.removeConstraint(description.constraint)
        : this.solver?.removeEditVariable(description.variable);
    } catch {
      this.solver = undefined;
    }

    this.variables.delete(index);
    this.recalculationRequired = true;
    this.dirty = true;
  }

  /**
   * Suggests a new value for an existing variable.
   *
   * For P0 priority variables, rebuilds the associated constraint.
   * For other priorities, suggests the value to the solver's edit system.
   * Only triggers updates if the value actually changes.
   *
   * @param index - Index of the variable to update
   * @param value - New suggested value
   * @throws Will throw an error if the variable doesn't exist
   */
  public suggestVariableValue(index: number, value: number): void {
    const description = this.variables.get(index);
    if (description === undefined) {
      throw new Error(`Variable ${index} does not exist`);
    }

    if (description.value !== value) {
      description.value = value;

      if (description.constraint) {
        description.constraint = this.rebuildConstraint(
          description.constraint,
          new UIExpression().plus(index, 1),
          new UIExpression(description.value),
          UIRelation.EQUAL,
          description.priority,
        );
      } else {
        this.solver?.suggestValue(description.variable, value);
      }

      this.recalculationRequired = true;
      this.dirty = true;
    }
  }

  /**
   * Changes the priority of an existing variable.
   *
   * Switching to/from P0 priority changes how the variable is handled:
   * - P0: Creates required constraint (must be satisfied exactly)
   * - Other: Uses edit variable system (can be adjusted by solver)
   *
   * @param index - Index of the variable to modify
   * @param priority - New priority level
   * @throws Will throw an error if the variable doesn't exist
   */
  public setVariablePriority(index: number, priority: UIPriority): void {
    const description = this.variables.get(index);
    if (description === undefined) {
      throw new Error(`Variable ${index} does not exist`);
    }

    if (priority !== description.priority) {
      description.priority = priority;

      if (description.priority === UIPriority.P0) {
        const lhs = new UIExpression().plus(index, 1);
        const rhs = new UIExpression(description.value);

        description.constraint = this.buildConstraint(
          lhs,
          rhs,
          UIRelation.EQUAL,
          description.priority,
        );

        try {
          this.solver?.addConstraint(description.constraint);
        } catch {
          this.solver = undefined;
        }
      } else {
        if (description.constraint) {
          try {
            this.solver?.removeConstraint(description.constraint);
          } catch {
            this.solver = undefined;
          }
        }

        description.constraint = undefined;
        this.rebuildVariable(index, description);
      }

      this.recalculationRequired = true;
      this.dirty = true;
    }
  }

  /**
   * Reads the current solved value of a variable.
   *
   * Triggers solver recalculation if needed and rebuilds the solver
   * if it was invalidated due to constraint conflicts.
   *
   * @param index - Index of the variable to read
   * @returns Current solved value of the variable
   * @throws Will throw an error if the variable doesn't exist
   */
  public readVariableValue(index: number): number {
    const description = this.variables.get(index);
    if (description === undefined) {
      throw new Error(`Variable ${index} does not exist`);
    }

    if (this.solver === undefined) {
      this.rebuildSolver();
    }

    if (this.recalculationRequired) {
      this.solver?.updateVariables();
      this.recalculationRequired = false;
    }

    return description.variable.value();
  }

  /**
   * Creates a new constraint between two expressions.
   *
   * Constraints can be enabled or disabled, and all properties can be
   * modified later without recreating the constraint.
   *
   * @param lhs - Left-hand side expression
   * @param rhs - Right-hand side expression
   * @param relation - Relational operator (equal, less than, greater than)
   * @param priority - Priority level for constraint solving
   * @param enabled - Whether the constraint is initially active
   * @returns Unique index identifier for the created constraint
   */
  public createConstraint(
    lhs: UIExpression,
    rhs: UIExpression,
    relation: UIRelation,
    priority: UIPriority,
    enabled: boolean,
  ): number {
    const index = this.lastConstraintIndex++;
    const constraint = this.buildConstraint(lhs, rhs, relation, priority);
    this.constraints.set(index, {
      constraint,
      lhs: lhs.clone(),
      rhs: rhs.clone(),
      priority,
      relation,
      enabled,
    });
    if (enabled) {
      try {
        this.solver?.addConstraint(constraint);
      } catch {
        this.solver = undefined;
      }
      this.recalculationRequired = true;
      this.dirty = true;
    }
    return index;
  }

  /**
   * Removes a constraint from the solver system.
   *
   * If the constraint is currently enabled, it will be removed from
   * the active solver before deletion.
   *
   * @param index - Index of the constraint to remove
   * @throws Will throw an error if the constraint doesn't exist
   */
  public removeConstraint(index: number): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    if (description.enabled) {
      try {
        this.solver?.removeConstraint(description.constraint);
      } catch {
        this.solver = undefined;
      }
    }

    this.constraints.delete(index);
    this.recalculationRequired = true;
    this.dirty = true;
  }

  /**
   * Updates the left-hand side expression of an existing constraint.
   *
   * Rebuilds the underlying constraint with the new expression while
   * preserving all other properties.
   *
   * @param index - Index of the constraint to modify
   * @param lhs - New left-hand side expression
   * @throws Will throw an error if the constraint doesn't exist
   */
  public setConstraintLHS(index: number, lhs: UIExpression): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.lhs.copy(lhs);
    this.rebuildConstraintByDescription(description);
    this.recalculationRequired = true;
    this.dirty = true;
  }

  /**
   * Updates the right-hand side expression of an existing constraint.
   *
   * Rebuilds the underlying constraint with the new expression while
   * preserving all other properties.
   *
   * @param index - Index of the constraint to modify
   * @param rhs - New right-hand side expression
   * @throws Will throw an error if the constraint doesn't exist
   */
  public setConstraintRHS(index: number, rhs: UIExpression): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.rhs.copy(rhs);
    this.rebuildConstraintByDescription(description);
    this.recalculationRequired = true;
    this.dirty = true;
  }

  /**
   * Updates the relational operator of an existing constraint.
   *
   * Changes how the left and right expressions are compared
   * (equal, less than, greater than).
   *
   * @param index - Index of the constraint to modify
   * @param relation - New relational operator
   * @throws Will throw an error if the constraint doesn't exist
   */
  public setConstraintRelation(index: number, relation: UIRelation): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    if (description.relation !== relation) {
      description.relation = relation;
      this.rebuildConstraintByDescription(description);
      this.recalculationRequired = true;
      this.dirty = true;
    }
  }

  /**
   * Updates the priority level of an existing constraint.
   *
   * Higher priority constraints are more likely to be satisfied
   * when conflicts arise.
   *
   * @param index - Index of the constraint to modify
   * @param priority - New priority level
   * @throws Will throw an error if the constraint doesn't exist
   */
  public setConstraintPriority(index: number, priority: UIPriority): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    if (description.priority !== priority) {
      description.priority = priority;
      this.rebuildConstraintByDescription(description);
      this.recalculationRequired = true;
      this.dirty = true;
    }
  }

  /**
   * Enables or disables an existing constraint.
   *
   * Disabled constraints are not considered during solving but
   * remain in the system for potential re-enabling.
   *
   * @param index - Index of the constraint to modify
   * @param enabled - Whether the constraint should be active
   * @throws Will throw an error if the constraint doesn't exist
   */
  public setConstraintEnabled(index: number, enabled: boolean): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    if (enabled !== description.enabled) {
      description.enabled = enabled;
      try {
        description.enabled
          ? this.solver?.addConstraint(description.constraint)
          : this.solver?.removeConstraint(description.constraint);
      } catch {
        this.solver = undefined;
      }
      this.recalculationRequired = true;
      this.dirty = true;
    }
  }

  /**
   * Rebuilds a variable in the solver system with new properties.
   *
   * Temporarily removes all constraints that reference the variable,
   * updates the variable configuration, then rebuilds and re-adds
   * the dependent constraints.
   */
  private rebuildVariable(
    index: number,
    description: VariableDescription,
  ): void {
    const dependConstraints: ConstraintDescription[] = [];

    for (const cDescription of this.constraints.values()) {
      if (cDescription.lhs.hasTerm(index) || cDescription.rhs.hasTerm(index)) {
        try {
          this.solver?.removeConstraint(cDescription.constraint);
        } catch {
          this.solver = undefined;
        }
        dependConstraints.push(cDescription);
      }
    }

    this.solver?.removeEditVariable(description.variable);
    this.solver?.addEditVariable(
      description.variable,
      convertPriority(description.priority),
    );

    for (const cDescription of dependConstraints) {
      cDescription.constraint = this.buildConstraint(
        cDescription.lhs,
        cDescription.rhs,
        cDescription.relation,
        cDescription.priority,
      );
    }

    for (const cDescription of dependConstraints) {
      try {
        this.solver?.addConstraint(cDescription.constraint);
      } catch {
        this.solver = undefined;
        break;
      }
    }
  }

  /**
   * Rebuilds a constraint based on its current description.
   *
   * Uses different rebuild strategies depending on whether the
   * constraint is currently enabled.
   */
  private rebuildConstraintByDescription(
    description: ConstraintDescription,
  ): void {
    description.constraint = description.enabled
      ? this.rebuildConstraint(
          description.constraint,
          description.lhs,
          description.rhs,
          description.relation,
          description.priority,
        )
      : this.buildConstraint(
          description.lhs,
          description.rhs,
          description.relation,
          description.priority,
        );
  }

  /**
   * Rebuilds a constraint by removing the old one and creating a new one.
   *
   * Safely handles solver state transitions and constraint replacement.
   */
  private rebuildConstraint(
    oldConstraint: Constraint,
    lhs: UIExpression,
    rhs: UIExpression,
    relation: UIRelation,
    priority: UIPriority,
  ): Constraint {
    try {
      this.solver?.removeConstraint(oldConstraint);
    } catch {
      this.solver = undefined;
    }

    const constraint = this.buildConstraint(lhs, rhs, relation, priority);

    try {
      this.solver?.addConstraint(constraint);
    } catch {
      this.solver = undefined;
    }

    return constraint;
  }

  /**
   * Creates a new Kiwi constraint from UI expressions and parameters.
   *
   * Converts UI-level expressions and enums to Kiwi-compatible formats.
   */
  private buildConstraint(
    lhs: UIExpression,
    rhs: UIExpression,
    relation: UIRelation,
    priority: UIPriority,
  ): Constraint {
    return new Constraint(
      this.convertExpression(lhs),
      convertRelation(relation),
      this.convertExpression(rhs),
      convertPriority(priority),
    );
  }

  /**
   * Converts a UIExpression to a Kiwi Expression.
   *
   * Maps variable indices to their corresponding Kiwi Variable instances
   * and preserves coefficients and constants.
   */
  private convertExpression(expression: UIExpression): Expression {
    return new Expression(
      ...expression["prepareTermsInternal"]().map(
        ([variableIndex, coefficient]): [number, Variable] => {
          const description = this.variables.get(variableIndex);
          if (description === undefined) {
            throw new Error(`Variable ${variableIndex} does not exist`);
          }
          return [coefficient, description.variable];
        },
      ),
      expression.constant,
    );
  }

  /**
   * Completely rebuilds the solver from scratch.
   *
   * Re-adds all variables and constraints to a fresh solver instance.
   * Used for recovery when the solver enters an invalid state.
   */
  private rebuildSolver(): void {
    if (this.solver) {
      throw new Error("Solver already exists");
    }

    this.solver = new Solver();

    for (const description of this.variables.values()) {
      if (description.constraint) {
        this.solver.addConstraint(description.constraint);
      } else {
        this.solver.addEditVariable(
          description.variable,
          convertPriority(description.priority),
        );
        this.solver.suggestValue(description.variable, description.value);
      }
    }

    for (const description of this.constraints.values()) {
      if (description.enabled) {
        this.solver.addConstraint(description.constraint);
      }
    }

    this.recalculationRequired = true;
    this.dirty = true;
  }
}

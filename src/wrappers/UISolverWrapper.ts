import { Constraint, Expression, Solver, Variable } from "@lume/kiwi";
import { UIExpression } from "../miscellaneous/UIExpression";
import { convertPriority, UIPriority } from "../miscellaneous/UIPriority";
import { convertRelation, UIRelation } from "../miscellaneous/UIRelation";

interface VariableDescription {
  variable: Variable;
  priority: UIPriority;
  value: number;
  constraint?: Constraint;
}

interface ConstraintDescription {
  constraint: Constraint;
  lhs: UIExpression;
  rhs: UIExpression;
  priority: UIPriority;
  relation: UIRelation;
  enabled: boolean;
}

export class UISolverWrapper {
  private solver = new Solver();
  private recalculationRequired = false;

  private readonly variables = new Map<number, VariableDescription>();
  private lastVariableIndex = 0;

  private readonly constraints = new Map<number, ConstraintDescription>();
  private lastConstraintIndex = 0;

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
      this.solver.addConstraint(description.constraint);
    } else {
      this.variables.set(index, { variable, priority, value });
      this.solver.addEditVariable(variable, convertPriority(priority));
      this.solver.suggestValue(variable, value);
    }
    this.recalculationRequired = true;
    return index;
  }

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

    description.constraint
      ? this.solver.removeConstraint(description.constraint)
      : this.solver.removeEditVariable(description.variable);

    this.variables.delete(index);
    this.recalculationRequired = true;
  }

  public suggestVariableValue(index: number, value: number): void {
    const description = this.variables.get(index);
    if (description === undefined) {
      throw new Error(`Variable ${index} does not exist`);
    }

    if (description.value !== value) {
      description.value = value;

      if (description.constraint) {
        description.constraint = this.rebuildRawConstraint(
          description.constraint,
          new UIExpression().plus(index, 1),
          new UIExpression(description.value),
          UIRelation.EQUAL,
          description.priority,
        );
      } else {
        this.solver.suggestValue(description.variable, value);
      }

      this.recalculationRequired = true;
    }
  }

  public setVariablePriority(index: number, priority: UIPriority): void {
    const description = this.variables.get(index);
    if (description === undefined) {
      throw new Error(`Variable ${index} does not exist`);
    }

    if (priority !== description.priority) {
      description.priority = priority;

      if (description.constraint) {
        description.constraint = this.rebuildRawConstraint(
          description.constraint,
          new UIExpression().plus(index, 1),
          new UIExpression(description.value),
          UIRelation.EQUAL,
          description.priority,
        );
      } else {
        this.rebuildVariable(index, description);
      }

      this.recalculationRequired = true;
    }
  }

  public readVariableValue(index: number): number {
    const description = this.variables.get(index);
    if (description === undefined) {
      throw new Error(`Variable ${index} does not exist`);
    }

    if (this.recalculationRequired) {
      this.solver.updateVariables();
      this.recalculationRequired = false;
    }

    return description.variable.value();
  }

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
      this.solver.addConstraint(constraint);
      this.recalculationRequired = true;
    }
    return index;
  }

  public removeConstraint(index: number): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    this.solver.removeConstraint(description.constraint);
    this.constraints.delete(index);
    this.recalculationRequired = true;
  }

  public setConstraintLHS(index: number, lhs: UIExpression): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.lhs.copy(lhs);
    this.rebuildConstraintByDescription(description);
    this.recalculationRequired = true;
  }

  public setConstraintRHS(index: number, rhs: UIExpression): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.rhs.copy(rhs);
    this.rebuildConstraintByDescription(description);
    this.recalculationRequired = true;
  }

  public setConstraintRelation(index: number, relation: UIRelation): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.relation = relation;
    this.rebuildConstraintByDescription(description);
    this.recalculationRequired = true;
  }

  public setConstraintPriority(index: number, priority: UIPriority): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.priority = priority;
    this.rebuildConstraintByDescription(description);
    this.recalculationRequired = true;
  }

  public setConstraintEnabled(index: number, enabled: boolean): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    if (enabled !== description.enabled) {
      description.enabled = enabled;
      try {
        description.enabled
          ? this.solver.addConstraint(description.constraint)
          : this.solver.removeConstraint(description.constraint);
      } catch {
        this.rebuildSolver();
      }
      this.recalculationRequired = true;
    }
  }

  private convertExpression(expression: UIExpression): Expression {
    return new Expression(
      ...expression["prepareTermsInternal"]().map(
        ([variableIndex, coefficient]): [number, Variable] => {
          const variable = this.variables.get(variableIndex);
          if (variable === undefined) {
            throw new Error(`Variable ${variableIndex} does not exist`);
          }
          return [coefficient, variable.variable];
        },
      ),
      expression.constant,
    );
  }

  private rebuildVariable(
    index: number,
    description: VariableDescription,
  ): void {
    let rebuildRequired = false;
    const dependConstraints: ConstraintDescription[] = [];

    for (const cDescription of this.constraints.values()) {
      if (cDescription.lhs.hasTerm(index) || cDescription.rhs.hasTerm(index)) {
        if (!rebuildRequired) {
          try {
            this.solver.removeConstraint(cDescription.constraint);
          } catch {
            rebuildRequired = true;
          }
        }
        dependConstraints.push(cDescription);
      }
    }

    this.solver.removeEditVariable(description.variable);
    this.solver.addEditVariable(
      description.variable,
      convertPriority(description.priority),
    );

    for (const cDescription of dependConstraints) {
      cDescription.constraint = new Constraint(
        this.convertExpression(cDescription.lhs),
        convertRelation(cDescription.relation),
        this.convertExpression(cDescription.rhs),
        convertPriority(cDescription.priority),
      );
    }

    if (!rebuildRequired) {
      for (const cDescription of dependConstraints) {
        try {
          this.solver.addConstraint(cDescription.constraint);
        } catch {
          rebuildRequired = true;
          break;
        }
      }
    }

    if (rebuildRequired) {
      this.rebuildSolver();
    }
  }

  private rebuildConstraintByDescription(
    description: ConstraintDescription,
  ): void {
    description.constraint = description.enabled
      ? this.rebuildRawConstraint(
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

  private rebuildRawConstraint(
    oldConstraint: Constraint,
    lhs: UIExpression,
    rhs: UIExpression,
    relation: UIRelation,
    priority: UIPriority,
  ): Constraint {
    let isSolverCrashed = false;

    try {
      this.solver.removeConstraint(oldConstraint);
    } catch {
      isSolverCrashed = true;
    }

    const constraint = this.buildConstraint(lhs, rhs, relation, priority);

    if (!isSolverCrashed) {
      try {
        this.solver.addConstraint(constraint);
      } catch {
        isSolverCrashed = true;
      }
    }

    if (isSolverCrashed) {
      this.rebuildSolver();
    }

    return constraint;
  }

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

  private rebuildSolver(): void {
    this.solver = new Solver();

    for (const description of this.variables.values()) {
      this.solver.addEditVariable(description.variable, description.priority);
      this.solver.suggestValue(description.variable, description.value);
    }

    for (const description of this.constraints.values()) {
      this.solver.addConstraint(description.constraint);
    }
  }
}

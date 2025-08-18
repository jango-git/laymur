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
  private solver? = new Solver();
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

    try {
      description.constraint
        ? this.solver?.removeConstraint(description.constraint)
        : this.solver?.removeEditVariable(description.variable);
    } catch {
      this.solver = undefined;
    }

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
    }
  }

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
    }
  }

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
    }
    return index;
  }

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
          ? this.solver?.addConstraint(description.constraint)
          : this.solver?.removeConstraint(description.constraint);
      } catch {
        this.solver = undefined;
      }
      this.recalculationRequired = true;
    }
  }

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
  }
}

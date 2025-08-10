import {
  Constraint,
  Expression,
  Operator,
  Solver,
  Strength,
  Variable,
} from "@lume/kiwi";

export enum UIRelation {
  EQUAL,
  LESS_THAN,
  GREATER_THAN,
}

export enum UIPriority {
  P0,
  P1,
  P2,
  P3,
  P4,
  P5,
  P6,
  P7,
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

export function convertPriority(priority: UIPriority): number {
  switch (priority) {
    case UIPriority.P0:
      return Strength.create(1000, 1000, 1000);
    case UIPriority.P1:
      return Strength.create(100, 0, 0);
    case UIPriority.P2:
      return Strength.create(10, 0, 0);
    case UIPriority.P3:
      return Strength.create(0, 100, 0);
    case UIPriority.P4:
      return Strength.create(0, 10, 0);
    case UIPriority.P5:
      return Strength.create(0, 0, 100);
    case UIPriority.P6:
      return Strength.create(0, 0, 10);
    case UIPriority.P7:
      return Strength.create(0, 0, 1);
    default:
      throw new Error(`Invalid priority: ${priority}`);
  }
}

// <variableIndex, coefficient>, constant
type RawExpression = [Map<number, number>, number];

interface VariableDescription {
  variable: Variable;
  priority: UIPriority;
  value: number;
  constraint?: Constraint;
}

interface ConstraintDescription {
  constraint: Constraint;
  lhs: RawExpression;
  rhs: RawExpression;
  priority: UIPriority;
  relation: UIRelation;
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
      const constraint = new Constraint(
        new Expression([1, variable]),
        convertRelation(UIRelation.EQUAL),
        new Expression(value),
        convertPriority(priority),
      );
      this.variables.set(index, { variable, priority, value, constraint });
      this.solver.addConstraint(constraint);
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
      if (cDescription.lhs[0].has(index) || cDescription.rhs[0].has(index)) {
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
        description.constraint = this.rebuildConstraint(
          description.constraint,
          [new Map<number, number>([[index, 1]]), 0],
          [new Map<number, number>(), value],
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
        description.constraint = this.rebuildConstraint(
          description.constraint,
          [new Map<number, number>([[index, 1]]), 0],
          [new Map<number, number>(), description.value],
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
    lhs: RawExpression,
    rhs: RawExpression,
    relation: UIRelation,
    priority: UIPriority,
  ): number {
    const index = this.lastConstraintIndex++;
    const constraint = new Constraint(
      this.convertRawExpression(lhs),
      convertRelation(relation),
      this.convertRawExpression(rhs),
      convertPriority(priority),
    );
    this.constraints.set(index, {
      constraint,
      lhs: [new Map(lhs[0].entries()), lhs[1]],
      rhs: [new Map(rhs[0].entries()), rhs[1]],
      priority,
      relation,
    });
    this.solver.addConstraint(constraint);
    this.recalculationRequired = true;
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

  public setConstraintLHS(index: number, lhs: RawExpression): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.lhs = [new Map(lhs[0].entries()), lhs[1]];
    description.constraint = this.rebuildConstraint(
      description.constraint,
      description.lhs,
      description.rhs,
      description.relation,
      description.priority,
    );
    this.recalculationRequired = true;
  }

  public setConstraintRHS(index: number, rhs: RawExpression): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.rhs = [new Map(rhs[0].entries()), rhs[1]];
    description.constraint = this.rebuildConstraint(
      description.constraint,
      description.lhs,
      description.rhs,
      description.relation,
      description.priority,
    );
    this.recalculationRequired = true;
  }

  public setConstraintRelation(index: number, relation: UIRelation): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.relation = relation;
    description.constraint = this.rebuildConstraint(
      description.constraint,
      description.lhs,
      description.rhs,
      description.relation,
      description.priority,
    );
    this.recalculationRequired = true;
  }

  public setConstraintPriority(index: number, priority: UIPriority): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.priority = priority;
    description.constraint = this.rebuildConstraint(
      description.constraint,
      description.lhs,
      description.rhs,
      description.relation,
      description.priority,
    );
    this.recalculationRequired = true;
  }

  private convertRawExpression([terms, constant]: RawExpression): Expression {
    return new Expression(
      ...Array.from(terms.entries()).map(
        ([variableIndex, coefficient]): [number, Variable] => {
          const variable = this.variables.get(variableIndex);
          if (variable === undefined) {
            throw new Error(`Variable ${variableIndex} does not exist`);
          }
          return [coefficient, variable.variable];
        },
      ),
      constant,
    );
  }

  private rebuildVariable(
    index: number,
    description: VariableDescription,
  ): void {
    let rebuildRequired = false;
    const dependConstraints: ConstraintDescription[] = [];

    for (const cDescription of this.constraints.values()) {
      if (cDescription.lhs[0].has(index) || cDescription.rhs[0].has(index)) {
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
        this.convertRawExpression(cDescription.lhs),
        convertRelation(cDescription.relation),
        this.convertRawExpression(cDescription.rhs),
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

  private rebuildConstraint(
    oldConstraint: Constraint,
    lhs: RawExpression,
    rhs: RawExpression,
    relation: UIRelation,
    priority: UIPriority,
  ): Constraint {
    let rebuildRequired = false;
    try {
      this.solver.removeConstraint(oldConstraint);
    } catch {
      rebuildRequired = true;
    }

    const constraint = new Constraint(
      this.convertRawExpression(lhs),
      convertRelation(relation),
      this.convertRawExpression(rhs),
      convertPriority(priority),
    );

    if (!rebuildRequired) {
      try {
        this.solver.addConstraint(constraint);
      } catch {
        rebuildRequired = true;
      }
    }

    if (rebuildRequired) {
      this.rebuildSolver();
    }

    return constraint;
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

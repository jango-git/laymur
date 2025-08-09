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

interface VariableDescription {
  variable: Variable;
  priority: UIPriority;
  value: number;
}

interface ConstraintDescription {
  constraint: Constraint;
  lhs: Map<number, number>;
  rhs: Map<number, number>;
  priority: UIPriority;
  relation: UIRelation;
}

export class UISolverWrapper {
  private solver = new Solver();

  private readonly variables = new Map<number, VariableDescription>();
  private lastVariableIndex = 0;

  private readonly constraints = new Map<number, ConstraintDescription>();
  private lastConstraintIndex = 0;

  public createVariable(value: number, priority: UIPriority): number {
    const index = this.lastVariableIndex++;
    const variable = new Variable();
    this.variables.set(index, { variable, priority, value });
    this.solver.addEditVariable(variable, convertPriority(priority));
    this.solver.suggestValue(variable, value);
    return index;
  }

  public removeVariable(index: number): void {
    const description = this.variables.get(index);
    if (description === undefined) {
      throw new Error(`Variable ${index} does not exist`);
    }

    this.solver.removeEditVariable(description.variable);
    this.variables.delete(index);
  }

  public suggestVariableValue(index: number, value: number): void {
    const description = this.variables.get(index);
    if (description === undefined) {
      throw new Error(`Variable ${index} does not exist`);
    }

    this.solver.suggestValue(description.variable, value);
  }

  public setVariablePriority(index: number, priority: UIPriority): void {
    const description = this.variables.get(index);
    if (description === undefined) {
      throw new Error(`Variable ${index} does not exist`);
    }

    if (priority !== description.priority) {
      description.priority = priority;
      this.rebuildVariable(index, description);
    }
  }

  public createConstraint(
    lhs: Map<number, number>,
    rhs: Map<number, number>,
    relation: UIRelation,
    priority: UIPriority,
  ): number {
    const index = this.lastConstraintIndex++;
    const constraint = new Constraint(
      this.convertExpression(lhs),
      convertRelation(relation),
      this.convertExpression(rhs),
      convertPriority(priority),
    );
    this.constraints.set(index, {
      constraint,
      lhs: new Map(lhs.entries()),
      rhs: new Map(rhs.entries()),
      priority,
      relation,
    });
    this.solver.addConstraint(constraint);
    return index;
  }

  public removeConstraint(index: number): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    this.solver.removeConstraint(description.constraint);
    this.constraints.delete(index);
  }

  public setConstraintLHS(index: number, lhs: Map<number, number>): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.lhs = new Map(lhs.entries());
    this.rebuildConstraint(description);
  }

  public setConstraintRHS(index: number, rhs: Map<number, number>): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.rhs = new Map(rhs.entries());
    this.rebuildConstraint(description);
  }

  public setConstraintRelation(index: number, relation: UIRelation): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.relation = relation;
    this.rebuildConstraint(description);
  }

  public setConstraintPriority(index: number, priority: UIPriority): void {
    const description = this.constraints.get(index);
    if (description === undefined) {
      throw new Error(`Constraint ${index} does not exist`);
    }

    description.priority = priority;
    this.rebuildConstraint(description);
  }

  private convertExpression(terms: Map<number, number>): Expression {
    return new Expression(
      ...Array.from(terms.entries()).map(
        ([variableIndex, coefficient]): [Variable, number] => {
          const variable = this.variables.get(variableIndex);
          if (variable === undefined) {
            throw new Error(`Variable ${variableIndex} does not exist`);
          }
          return [variable.variable, coefficient];
        },
      ),
    );
  }

  private rebuildVariable(
    index: number,
    description: VariableDescription,
  ): void {
    let rebuildRequired = false;
    const dependConstraints: ConstraintDescription[] = [];

    for (const cDescription of this.constraints.values()) {
      if (cDescription.lhs.has(index) || cDescription.rhs.has(index)) {
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

  private rebuildConstraint(description: ConstraintDescription): void {
    let rebuildRequired = false;
    try {
      this.solver.removeConstraint(description.constraint);
    } catch {
      rebuildRequired = true;
    }

    description.constraint = new Constraint(
      this.convertExpression(description.lhs),
      convertRelation(description.relation),
      this.convertExpression(description.rhs),
      convertPriority(description.priority),
    );

    if (!rebuildRequired) {
      try {
        this.solver.addConstraint(description.constraint);
      } catch {
        rebuildRequired = true;
      }
    }

    if (rebuildRequired) {
      this.rebuildSolver();
    }
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

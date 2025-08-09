import { Constraint, Expression, Solver, Variable } from "@lume/kiwi";
import { Eventail } from "eventail";

abstract class UISolverMessage {
  public abstract eventIndex: number;
}

class UIMessageWillRebuildVariable extends UISolverMessage {
  public static eventIndex = 0;
  constructor(public readonly variable: UISolverVariable) {
    super();
  }
  public get eventIndex(): number {
    return UIMessageWillRebuildVariable.eventIndex;
  }
}

class UIMessageRebuildVariable extends UISolverMessage {
  public static eventIndex = 1;
  constructor(public readonly variable: UISolverVariable) {
    super();
  }
  public get eventIndex(): number {
    return UIMessageRebuildVariable.eventIndex;
  }
}

class UIMessageWillRebuildConstraint extends UISolverMessage {
  public static eventIndex = 2;
  constructor(public readonly constraint: UISolverConstraint) {
    super();
  }
  public get eventIndex(): number {
    return UIMessageWillRebuildConstraint.eventIndex;
  }
}

class UIMessageRebuildConstraint extends UISolverMessage {
  public static eventIndex = 3;
  constructor(public readonly constraint: UISolverConstraint) {
    super();
  }
  public get eventIndex(): number {
    return UIMessageRebuildConstraint.eventIndex;
  }
}

class UIMessageWillRebuildExpression extends UISolverMessage {
  public static eventIndex = 4;
  constructor(public readonly expression: UISolverExpression) {
    super();
  }
  public get eventIndex(): number {
    return UIMessageWillRebuildExpression.eventIndex;
  }
}

class UIMessageRebuildExpression extends UISolverMessage {
  public static eventIndex = 5;
  constructor(public readonly expression: UISolverExpression) {
    super();
  }
  public get eventIndex(): number {
    return UIMessageRebuildExpression.eventIndex;
  }
}

class UISolverBus extends Eventail {
  public sendMessage(message: UISolverMessage): void {
    this.emit(message.eventIndex, message);
  }
}

export class UISolver {
  private readonly solver = new Solver();
  private readonly bus = new UISolverBus();

  public createVariable(value: number, priority: UIPriority): UISolverVariable {
    return UISolverVariable["create"](value, priority, this.solver, this.bus);
  }

  public createConstraint(
    lhs: UISolverExpression,
    rhs: UISolverExpression,
    relation: UIRelation,
    priority: UIPriority,
  ): UISolverConstraint {
    return UISolverConstraint["create"](
      lhs,
      rhs,
      relation,
      priority,
      this.solver,
      this.bus,
    );
  }

  public createExpression(
    terms: [UISolverVariable, number][],
    constant: number,
  ): UISolverExpression {
    return UISolverExpression["create"](terms, constant, this.bus);
  }
}

export class UISolverVariable {
  private valueInternal: number;
  private priorityInternal: UIPriority;
  private readonly variableInternal: Variable;
  private readonly solverInternal: Solver;
  private readonly busInternal: UISolverBus;

  private constructor(
    value: number,
    priority: UIPriority,
    solver: Solver,
    bus: UISolverBus,
  ) {
    this.valueInternal = value;
    this.priorityInternal = priority;
    this.variableInternal = new Variable();
    this.solverInternal = solver;
    this.busInternal = bus;

    this.solverInternal.addEditVariable(
      this.variableInternal,
      convertPriority(this.priorityInternal),
    );
  }

  public get value(): number {
    return this.valueInternal;
  }

  public get priority(): UIPriority {
    return this.priorityInternal;
  }

  public set value(value: number) {
    this.valueInternal = value;
    this.solverInternal.suggestValue(this.variableInternal, this.valueInternal);
  }

  public set priority(priority: UIPriority) {
    this.priorityInternal = priority;
    this.busInternal.sendMessage(new UIMessageWillRebuildVariable(this));
    this.solverInternal.removeEditVariable(this.variableInternal);
    this.solverInternal.addEditVariable(
      this.variableInternal,
      convertPriority(this.priorityInternal),
    );
    this.busInternal.sendMessage(new UIMessageRebuildVariable(this));
  }

  protected static create(
    value: number,
    priority: UIPriority,
    solver: Solver,
    bus: UISolverBus,
  ): UISolverVariable {
    return new UISolverVariable(value, priority, solver, bus);
  }

  protected ["getVariableInternal"](): Variable {
    return this.variableInternal;
  }
}

export class UISolverConstraint {
  private lhsInternal: UISolverExpression;
  private rhsInternal: UISolverExpression;
  private relationInternal: UIRelation;
  private priorityInternal: UIPriority;
  private constraintInternal: Constraint;
  private readonly solverInternal: Solver;
  private readonly busInternal: UISolverBus;

  protected constructor(
    lhs: UISolverExpression,
    rhs: UISolverExpression,
    relation: UIRelation,
    priority: UIPriority,
    solver: Solver,
    bus: UISolverBus,
  ) {
    this.lhsInternal = lhs;
    this.rhsInternal = rhs;
    this.relationInternal = relation;
    this.priorityInternal = priority;
    this.solverInternal = solver;
    this.busInternal = bus;

    this.constraintInternal = this.buildExpression();
    this.solverInternal.addConstraint(this.constraintInternal);

    this.busInternal.on(
      UIMessageWillRebuildExpression.eventIndex,
      (message: UIMessageWillRebuildExpression) => {
        if (
          this.lhs === message.expression ||
          this.rhs === message.expression
        ) {
          this.busInternal.sendMessage(
            new UIMessageWillRebuildConstraint(this),
          );
          this.solverInternal.removeConstraint(this.constraintInternal);
        }
      },
    );

    this.busInternal.on(
      UIMessageRebuildExpression.eventIndex,
      (message: UIMessageRebuildExpression) => {
        if (
          this.lhs === message.expression ||
          this.rhs === message.expression
        ) {
          this.constraintInternal = this.buildExpression();
          this.busInternal.sendMessage(new UIMessageRebuildConstraint(this));
        }
      },
    );
  }

  public get lhs(): UISolverExpression {
    return this.lhsInternal;
  }

  public get rhs(): UISolverExpression {
    return this.rhsInternal;
  }

  public get relation(): UIRelation {
    return this.relationInternal;
  }

  public get priority(): UIPriority {
    return this.priorityInternal;
  }

  public set lhs(expression: UISolverExpression) {
    this.lhsInternal = expression;
    this.rebuild();
  }

  public set rhs(expression: UISolverExpression) {
    this.rhsInternal = expression;
    this.rebuild();
  }

  public set relation(relation: UIRelation) {
    this.relationInternal = relation;
    this.rebuild();
  }

  public set priority(priority: UIPriority) {
    this.priorityInternal = priority;
    this.rebuild();
  }

  protected static create(
    lhs: UISolverExpression,
    rhs: UISolverExpression,
    relation: UIRelation,
    priority: UIPriority,
    solver: Solver,
    bus: UISolverBus,
  ): UISolverConstraint {
    return new UISolverConstraint(lhs, rhs, relation, priority, solver, bus);
  }

  private rebuild(): void {
    this.busInternal.sendMessage(new UIMessageWillRebuildConstraint(this));
    this.solverInternal.removeConstraint(this.constraintInternal);
    this.constraintInternal = this.buildExpression();
    this.busInternal.sendMessage(new UIMessageRebuildConstraint(this));
  }

  private buildExpression(): Constraint {
    return new Constraint(
      this.lhsInternal["getExpressionInternal"](),
      convertRelation(this.relationInternal),
      this.rhsInternal["getExpressionInternal"](),
      convertPriority(this.priorityInternal),
    );
  }
}

export class UISolverExpression {
  private constantInternal: number;
  private readonly termsInternal: Map<UISolverVariable, number>;
  private expressionInternal = new Expression();
  private readonly busInternal: UISolverBus;

  constructor(
    terms: [UISolverVariable, number][],
    constant: number,
    bus: UISolverBus,
  ) {
    this.constantInternal = constant;
    this.termsInternal = new Map<UISolverVariable, number>(terms);
    this.expressionInternal = new Expression(...terms);
    this.busInternal = bus;

    this.busInternal.on(
      UIMessageWillRebuildVariable.eventIndex,
      (message: UIMessageWillRebuildVariable) => {
        if (this.termsInternal.has(message.variable)) {
          this.busInternal.sendMessage(
            new UIMessageWillRebuildExpression(this),
          );
        }
      },
    );

    this.busInternal.on(
      UIMessageRebuildVariable.eventIndex,
      (message: UIMessageWillRebuildVariable) => {
        if (this.termsInternal.has(message.variable)) {
          this.expressionInternal = this.buildExpression();
          this.busInternal.sendMessage(new UIMessageRebuildExpression(this));
        }
      },
    );
  }

  public get constant(): number {
    return this.constantInternal;
  }

  public set constant(constant: number) {
    this.constantInternal = constant;
    this.expressionInternal = this.expressionInternal.plus(
      constant - this.expressionInternal.constant(),
    );
  }

  protected static create(
    terms: [UISolverVariable, number][],
    constant: number,
    bus: UISolverBus,
  ): UISolverExpression {
    return new UISolverExpression(terms, constant, bus);
  }

  public addVariable(variable: UISolverVariable, coefficient: number): void {
    const currentCoefficient = this.termsInternal.get(variable) ?? 0;
    const summ = currentCoefficient + coefficient;
    summ === 0
      ? this.termsInternal.delete(variable)
      : this.termsInternal.set(variable, summ);

    this.busInternal.sendMessage(new UIMessageWillRebuildExpression(this));
    this.expressionInternal = this.buildExpression();
    this.busInternal.sendMessage(new UIMessageRebuildExpression(this));
  }

  public subVariable(variable: UISolverVariable, coefficient: number): void {
    this.addVariable(variable, -coefficient);
  }

  protected ["getExpressionInternal"](): Expression {
    return this.expressionInternal;
  }

  private buildExpression(): Expression {
    return new Expression(
      Array.from(this.termsInternal.entries()).map(
        ([v, c]): [Variable, number] => [v["getVariableInternal"](), c],
      ),
      this.constantInternal,
    );
  }
}

import { Constraint, Expression, Operator } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../UILayer";
import {
  addConstraint,
  hSymbol,
  layerSymbol,
  removeConstraint,
} from "../symbols";
import { UIConstraint } from "./UIConstraint";
import { powerToStrength, UIConstraintPower } from "./UIConstraintPower";
import { ruleToOperator, UIConstraintRule } from "./UIConstraintRule";

export interface UIVerticalProportionParameters {
  proportion?: number;
  power?: UIConstraintPower;
  rule?: UIConstraintRule;
}

interface InnerParameters {
  proportion: number;
  strength: number;
  operator: Operator;
}

export class UIVerticalProportionConstraint extends UIConstraint {
  private readonly parameters: InnerParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters: UIVerticalProportionParameters = {},
  ) {
    super();
    this.parameters = {
      proportion: parameters.proportion ?? 1,
      strength: powerToStrength(parameters.power),
      operator: ruleToOperator(parameters.rule),
    };
    this.rebuildConstraint();
  }

  public get proportion(): number {
    return this.parameters.proportion;
  }

  public set proportion(value: number) {
    if (value === this.parameters.proportion) return;
    this.parameters.proportion = value;
    this.rebuildConstraint();
  }

  public destroy(): void {
    this.destroyConstraints();
  }

  private destroyConstraints(): void {
    if (this.constraint) {
      this.elementTwo[layerSymbol][removeConstraint](this.constraint);
    }
  }

  private rebuildConstraint(): void {
    if (this.constraint) {
      this.elementTwo[layerSymbol][removeConstraint](this.constraint);
    }

    const expressionOne = new Expression(this.elementOne[hSymbol]).multiply(
      this.parameters.proportion,
    );
    const expressionTwo = new Expression(this.elementTwo[hSymbol]);

    this.constraint = new Constraint(
      expressionOne.minus(expressionTwo),
      this.parameters.operator,
      0,
      this.parameters.strength,
    );

    this.elementTwo[layerSymbol][addConstraint](this.constraint);
  }
}

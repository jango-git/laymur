import { Constraint, Expression, Operator } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";
import {
  addConstraint,
  layerSymbol,
  removeConstraint,
  wSymbol,
  xSymbol,
} from "../Miscellaneous/symbols";
import { UIConstraint } from "./UIConstraint";
import { powerToStrength, UIConstraintPower } from "./UIConstraintPower";
import { ruleToOperator, UIConstraintRule } from "./UIConstraintRule";

export interface UIHorizontalDistanceParameters {
  anchorOne: number;
  anchorTwo: number;
  distance: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
}

interface InnerParameters {
  anchorOne: number;
  anchorTwo: number;
  distance: number;
  strength: number;
  operator: Operator;
}

export class UIHorizontalDistanceConstraint extends UIConstraint {
  private readonly parameters: InnerParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UIHorizontalDistanceParameters>,
  ) {
    super();
    this.parameters = {
      anchorOne: parameters?.anchorOne ?? 0.5,
      anchorTwo: parameters?.anchorTwo ?? 0.5,
      distance: parameters?.distance ?? 0,
      strength: powerToStrength(parameters?.power),
      operator: ruleToOperator(parameters?.rule),
    };
    this.rebuildConstraint();
  }

  public get distance(): number {
    return this.parameters.distance;
  }

  public set distance(value: number) {
    if (value === this.parameters.distance) return;
    this.parameters.distance = value;
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
    this.destroyConstraints();

    const expressionOne = new Expression(this.elementOne[xSymbol]).plus(
      new Expression(this.elementOne[wSymbol]).multiply(
        this.parameters.anchorOne,
      ),
    );

    const expressionTwo = new Expression(this.elementTwo[xSymbol]).plus(
      new Expression(this.elementTwo[wSymbol]).multiply(
        this.parameters.anchorTwo,
      ),
    );

    this.constraint = new Constraint(
      expressionTwo.minus(expressionOne),
      this.parameters.operator,
      this.parameters.distance,
      this.parameters.strength,
    );

    this.elementTwo[layerSymbol][addConstraint](this.constraint);
  }
}

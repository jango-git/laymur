import { Constraint, Expression, Operator } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import {
  addConstraint,
  layerSymbol,
  removeConstraint,
  wSymbol,
} from "../Miscellaneous/symbols";
import { UIConstraint } from "./UIConstraint";
import { powerToStrength, UIConstraintPower } from "./UIConstraintPower";
import { ruleToOperator, UIConstraintRule } from "./UIConstraintRule";

export interface UIWidthParameters {
  width?: number;
  power?: UIConstraintPower;
  rule?: UIConstraintRule;
}

interface InnerParameters {
  width: number;
  strength: number;
  operator: Operator;
}

export class UIWidthConstraint extends UIConstraint {
  private readonly parameters: InnerParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly element: UIElement,
    parameters: UIWidthParameters = {},
  ) {
    super();
    this.parameters = {
      width: parameters.width ?? 100,
      strength: powerToStrength(parameters.power),
      operator: ruleToOperator(parameters.rule),
    };
    this.rebuildConstraint();
  }

  public get width(): number {
    return this.parameters.width;
  }

  public set width(value: number) {
    if (value === this.parameters.width) return;
    this.parameters.width = value;
    this.rebuildConstraint();
  }

  public destroy(): void {
    this.destroyConstraints();
  }

  private destroyConstraints(): void {
    if (this.constraint) {
      this.element[layerSymbol][removeConstraint](this.constraint);
    }
  }

  private rebuildConstraint(): void {
    this.destroyConstraints();

    this.constraint = new Constraint(
      new Expression(this.element[wSymbol]),
      this.parameters.operator,
      this.parameters.width,
      this.parameters.strength,
    );

    this.element[layerSymbol][addConstraint](this.constraint);
  }
}

import { Constraint, Expression, Operator } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import {
  addConstraint,
  hSymbol,
  layerSymbol,
  removeConstraint,
} from "../symbols";
import { UIConstraint } from "./UIConstraint";
import { powerToStrength, UIConstraintPower } from "./UIConstraintPower";
import { ruleToOperator, UIConstraintRule } from "./UIConstraintRule";

export interface UIHeightParameters {
  height?: number;
  power?: UIConstraintPower;
  rule?: UIConstraintRule;
}

interface InnerParameters {
  height: number;
  strength: number;
  operator: Operator;
}

export class UIHeightConstraint extends UIConstraint {
  private readonly parameters: InnerParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly element: UIElement,
    parameters: UIHeightParameters = {},
  ) {
    super();
    this.parameters = {
      height: parameters.height ?? 100,
      strength: powerToStrength(parameters.power),
      operator: ruleToOperator(parameters.rule),
    };
    this.rebuildConstraint();
  }

  public get height(): number {
    return this.parameters.height;
  }

  public set height(value: number) {
    if (value === this.parameters.height) return;
    this.parameters.height = value;
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
      new Expression(this.element[hSymbol]),
      this.parameters.operator,
      this.parameters.height,
      this.parameters.strength,
    );

    this.element[layerSymbol][addConstraint](this.constraint);
  }
}

import { Constraint, Expression, Operator } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import {
  addConstraint,
  hSymbol,
  layerSymbol,
  removeConstraint,
  wSymbol,
} from "../Miscellaneous/symbols";
import { UIConstraint } from "./UIConstraint";
import { powerToStrength, UIConstraintPower } from "./UIConstraintPower";
import { ruleToOperator, UIConstraintRule } from "./UIConstraintRule";

export interface UIAspectParameters {
  aspect: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
}

interface InnerParameters {
  aspect: number;
  strength: number;
  operator: Operator;
}

export class UIAspectConstraint extends UIConstraint {
  private readonly parameters: InnerParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly element: UIElement,
    parameters?: Partial<UIAspectParameters>,
  ) {
    super();
    this.parameters = {
      aspect: parameters?.aspect ?? this.element.width / this.element.height,
      strength: powerToStrength(parameters?.power),
      operator: ruleToOperator(parameters?.rule),
    };
    this.rebuildConstraint();
  }

  public get aspect(): number {
    return this.parameters.aspect;
  }

  public set aspect(value: number) {
    if (value === this.parameters.aspect) return;
    this.parameters.aspect = value;
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

    const expression = new Expression(this.element[wSymbol]).plus(
      new Expression(this.element[hSymbol]).multiply(-this.parameters.aspect),
    );

    this.constraint = new Constraint(
      expression,
      this.parameters.operator,
      0,
      this.parameters.strength,
    );
    this.element[layerSymbol][addConstraint](this.constraint);
  }
}

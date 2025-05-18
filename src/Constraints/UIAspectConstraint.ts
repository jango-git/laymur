import { Constraint, Expression, Operator } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import {
  addConstraint,
  addRawConstraint,
  hSymbol,
  layerSymbol,
  removeConstraint,
  removeRawConstraint,
  resizeSymbol,
  wSymbol,
} from "../Miscellaneous/symbols";
import { UIConstraint } from "./UIConstraint";
import {
  resolveOrientation,
  UIConstraintOrientation,
} from "./UIConstraintOrientation";
import { powerToStrength, UIConstraintPower } from "./UIConstraintPower";
import { ruleToOperator, UIConstraintRule } from "./UIConstraintRule";

export interface UIAspectParameters {
  aspect: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIConstraintOrientation;
}

interface InnerParameters {
  aspect: number;
  strength: number;
  operator: Operator;
  orientation: UIConstraintOrientation;
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
      orientation: resolveOrientation(parameters?.orientation),
    };
    this.element[layerSymbol][addConstraint](this);
    if (this.element[layerSymbol].orientation & this.parameters.orientation) {
      this.rebuildConstraints();
    }
  }

  public get aspect(): number {
    return this.parameters.aspect;
  }

  public set aspect(value: number) {
    if (value === this.parameters.aspect) return;
    this.parameters.aspect = value;
    this.rebuildConstraints();
  }

  public destroy(): void {
    this.destroyConstraints();
    this.element[layerSymbol][removeConstraint](this);
  }

  [resizeSymbol](orientation: UIConstraintOrientation): void {
    if (this.parameters.orientation !== UIConstraintOrientation.always) {
      if (orientation === this.parameters.orientation)
        this.rebuildConstraints();
      else this.destroyConstraints();
    }
  }

  private destroyConstraints(): void {
    if (this.constraint) {
      this.element[layerSymbol][removeRawConstraint](this.constraint);
      this.constraint = undefined;
    }
  }

  private rebuildConstraints(): void {
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
    this.element[layerSymbol][addRawConstraint](this.constraint);
  }
}

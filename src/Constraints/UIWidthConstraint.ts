import { Constraint, Expression, Operator } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import {
  addConstraint,
  addRawConstraint,
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

export interface UIWidthParameters {
  width: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIConstraintOrientation;
}

interface InnerParameters {
  width: number;
  strength: number;
  operator: Operator;
  orientation: UIConstraintOrientation;
}

export class UIWidthConstraint extends UIConstraint {
  private readonly parameters: InnerParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly element: UIElement,
    parameters?: Partial<UIWidthParameters>,
  ) {
    super();
    this.parameters = {
      width: parameters?.width ?? 100,
      strength: powerToStrength(parameters?.power),
      operator: ruleToOperator(parameters?.rule),
      orientation: resolveOrientation(parameters?.orientation),
    };
    this.element[layerSymbol][addConstraint](this);
    if (this.element[layerSymbol].orientation & this.parameters.orientation) {
      this.rebuildConstraints();
    }
  }

  public get width(): number {
    return this.parameters.width;
  }

  public set width(value: number) {
    if (value === this.parameters.width) return;
    this.parameters.width = value;
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

    this.constraint = new Constraint(
      new Expression(this.element[wSymbol]),
      this.parameters.operator,
      this.parameters.width,
      this.parameters.strength,
    );

    this.element[layerSymbol][addRawConstraint](this.constraint);
  }
}

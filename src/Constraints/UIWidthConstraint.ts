import { Constraint, Expression } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import {
  addConstraintSymbol,
  addRawConstraintSymbol,
  removeConstraintSymbol,
  removeRawConstraintSymbol,
  resizeSymbol,
  widthSymbol,
} from "../Miscellaneous/symbols";
import {
  resolveOrientation,
  UIOrientation,
} from "../Miscellaneous/UIOrientation";
import { UIConstraint } from "./UIConstraint";
import {
  convertPowerToStrength,
  resolvePower,
  UIConstraintPower,
} from "./UIConstraintPower";
import {
  convertRuleToOperator,
  resolveRule,
  UIConstraintRule,
} from "./UIConstraintRule";

export interface UIWidthParameters {
  width: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIOrientation;
}

export class UIWidthConstraint extends UIConstraint {
  private readonly parameters: UIWidthParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly element: UIElement,
    parameters?: Partial<UIWidthParameters>,
  ) {
    super(element.layer);

    this.parameters = {
      width: parameters?.width ?? 100,
      power: resolvePower(parameters?.power),
      rule: resolveRule(parameters?.rule),
      orientation: resolveOrientation(parameters?.orientation),
    };

    this.layer[addConstraintSymbol](this);

    if (
      this.parameters.orientation === UIOrientation.always ||
      this.parameters.orientation === this.layer.orientation
    ) {
      this.buildConstraints();
    }
  }

  public destroy(): void {
    this.destroyConstraints();
    this.layer[removeConstraintSymbol](this);
  }

  public [resizeSymbol](orientation: UIOrientation): void {
    if (this.parameters.orientation !== UIOrientation.always) {
      if (orientation === this.parameters.orientation) this.buildConstraints();
      else this.destroyConstraints();
    }
  }

  protected buildConstraints(): void {
    this.constraint = new Constraint(
      new Expression(this.element[widthSymbol]),
      convertRuleToOperator(this.parameters.rule),
      this.parameters.width,
      convertPowerToStrength(this.parameters.power),
    );

    this.layer[addRawConstraintSymbol](this.constraint);
  }

  protected destroyConstraints(): void {
    if (this.constraint) {
      this.layer[removeRawConstraintSymbol](this.constraint);
      this.constraint = undefined;
    }
  }
}

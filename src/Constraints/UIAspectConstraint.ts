import { Constraint, Expression } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import {
  addConstraintSymbol,
  addRawConstraintSymbol,
  heightSymbol,
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

export interface UIAspectParameters {
  aspect: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIOrientation;
}

export class UIAspectConstraint extends UIConstraint {
  private readonly parameters: UIAspectParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly element: UIElement,
    parameters?: Partial<UIAspectParameters>,
  ) {
    super(element.layer);

    this.parameters = {
      aspect: parameters?.aspect ?? this.element.width / this.element.height,
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
    const expression = new Expression(this.element[widthSymbol]).plus(
      new Expression(this.element[heightSymbol]).multiply(
        -this.parameters.aspect,
      ),
    );

    this.constraint = new Constraint(
      expression,
      convertRuleToOperator(this.parameters.rule),
      0,
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

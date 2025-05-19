import { Constraint, Expression } from "kiwi.js";
import type { UIElement } from "../Elements/UIElement";
import {
  addConstraintSymbol,
  disableConstraintSymbol,
  enableConstraintSymbol,
  heightSymbol,
  removeConstraintSymbol,
  widthSymbol,
} from "../Miscellaneous/symbols";
import {
  resolveOrientation,
  UIOrientation,
} from "../Miscellaneous/UIOrientation";
import { UIConstraint } from "./UIConstraint";
import type { UIConstraintPower } from "./UIConstraintPower";
import { convertPowerToStrength, resolvePower } from "./UIConstraintPower";
import type { UIConstraintRule } from "./UIConstraintRule";
import { convertRuleToOperator, resolveRule } from "./UIConstraintRule";

export interface UIAspectParameters {
  aspect: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIOrientation;
}

export class UIAspectConstraint extends UIConstraint {
  private readonly parameters: UIAspectParameters;
  private constraint?: Constraint;

  constructor(
    private readonly element: UIElement,
    parameters?: Partial<UIAspectParameters>,
  ) {
    super(element.layer, new Set([element]));

    this.parameters = {
      aspect: parameters?.aspect ?? this.element.width / this.element.height,
      power: resolvePower(parameters?.power),
      rule: resolveRule(parameters?.rule),
      orientation: resolveOrientation(parameters?.orientation),
    };

    if (
      this.parameters.orientation === UIOrientation.ALWAYS ||
      this.parameters.orientation === this.layer.orientation
    ) {
      this.buildConstraints();
    }
  }

  public override destroy(): void {
    this.destroyConstraints();
    super.destroy();
  }

  public [disableConstraintSymbol](newOrientation: UIOrientation): void {
    if (
      this.parameters.orientation !== UIOrientation.ALWAYS &&
      newOrientation !== this.parameters.orientation
    ) {
      this.destroyConstraints();
    }
  }

  public [enableConstraintSymbol](newOrientation: UIOrientation): void {
    if (
      this.parameters.orientation !== UIOrientation.ALWAYS &&
      newOrientation === this.parameters.orientation
    ) {
      this.buildConstraints();
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

    this.layer[addConstraintSymbol](this, this.constraint);
  }

  protected destroyConstraints(): void {
    if (this.constraint) {
      this.layer[removeConstraintSymbol](this, this.constraint);
      this.constraint = undefined;
    }
  }
}

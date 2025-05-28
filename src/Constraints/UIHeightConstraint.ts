import { Constraint, Expression } from "kiwi.js";
import type { UIElement } from "../Elements/UIElement";
import {
  addConstraintSymbol,
  disableConstraintSymbol,
  enableConstraintSymbol,
  heightSymbol,
  removeConstraintSymbol,
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

export interface UIHeightOptions {
  height: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIOrientation;
}

export class UIHeightConstraint extends UIConstraint {
  private readonly options: UIHeightOptions;
  private constraint?: Constraint;

  constructor(
    private readonly element: UIElement,
    options?: Partial<UIHeightOptions>,
  ) {
    super(element.layer, new Set([element]));

    this.options = {
      height: options?.height ?? element.height,
      power: resolvePower(options?.power),
      rule: resolveRule(options?.rule),
      orientation: resolveOrientation(options?.orientation),
    };

    if (
      this.options.orientation === UIOrientation.ALWAYS ||
      this.options.orientation === this.layer.orientation
    ) {
      this.buildConstraints();
    }
  }

  public override destroy(): void {
    this.destroyConstraints();
    super.destroy();
  }

  public [disableConstraintSymbol](orientation: UIOrientation): void {
    if (
      this.options.orientation !== UIOrientation.ALWAYS &&
      orientation !== this.options.orientation
    ) {
      this.destroyConstraints();
    }
  }

  public [enableConstraintSymbol](orientation: UIOrientation): void {
    if (
      this.options.orientation !== UIOrientation.ALWAYS &&
      orientation === this.options.orientation
    ) {
      this.buildConstraints();
    }
  }

  protected buildConstraints(): void {
    this.constraint = new Constraint(
      new Expression(this.element[heightSymbol]),
      convertRuleToOperator(this.options.rule),
      this.options.height,
      convertPowerToStrength(this.options.power),
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

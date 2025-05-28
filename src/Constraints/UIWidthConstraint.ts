import { Constraint, Expression } from "kiwi.js";
import type { UIElement } from "../Elements/UIElement";
import {
  addConstraintSymbol,
  disableConstraintSymbol,
  enableConstraintSymbol,
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

export interface UIWidthOptions {
  width: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIOrientation;
}

export class UIWidthConstraint extends UIConstraint {
  private readonly options: UIWidthOptions;
  private constraint?: Constraint;

  constructor(
    private readonly element: UIElement,
    options?: Partial<UIWidthOptions>,
  ) {
    super(element.layer, new Set([element]));

    this.options = {
      width: options?.width ?? element.width,
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
      new Expression(this.element[widthSymbol]),
      convertRuleToOperator(this.options.rule),
      this.options.width,
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

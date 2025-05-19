import { Constraint, Expression } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import type { UILayer } from "../Layers/UILayer";
import { assertSameLayer } from "../Miscellaneous/asserts";
import {
  addConstraintSymbol,
  heightSymbol,
  removeConstraintSymbol,
  resizeSymbol,
  ySymbol,
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

export interface UIVerticalDistanceParameters {
  anchorOne: number;
  anchorTwo: number;
  distance: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIOrientation;
}

export class UIVerticalDistanceConstraint extends UIConstraint {
  private readonly parameters: UIVerticalDistanceParameters;
  private constraint?: Constraint;

  constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UIVerticalDistanceParameters>,
  ) {
    assertSameLayer(elementOne, elementTwo);
    super(
      elementTwo.layer,
      new Set(
        elementOne instanceof UIElement
          ? [elementOne, elementTwo]
          : [elementTwo],
      ),
    );

    this.parameters = {
      anchorOne: parameters?.anchorOne ?? 0.5,
      anchorTwo: parameters?.anchorTwo ?? 0.5,
      distance: parameters?.distance ?? 0,
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

  public [resizeSymbol](orientation: UIOrientation): void {
    if (this.parameters.orientation !== UIOrientation.ALWAYS) {
      if (orientation === this.parameters.orientation) {
        this.buildConstraints();
      } else {
        this.destroyConstraints();
      }
    }
  }

  protected buildConstraints(): void {
    const expressionOne = new Expression(this.elementOne[ySymbol]).plus(
      new Expression(this.elementOne[heightSymbol]).multiply(
        this.parameters.anchorOne,
      ),
    );

    const expressionTwo = new Expression(this.elementTwo[ySymbol]).plus(
      new Expression(this.elementTwo[heightSymbol]).multiply(
        this.parameters.anchorTwo,
      ),
    );

    this.constraint = new Constraint(
      expressionTwo.minus(expressionOne),
      convertRuleToOperator(this.parameters.rule),
      this.parameters.distance,
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

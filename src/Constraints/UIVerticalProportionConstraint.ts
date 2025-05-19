import { Constraint, Expression } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";
import { assertSameLayer } from "../Miscellaneous/asserts";
import {
  addConstraintSymbol,
  addRawConstraintSymbol,
  heightSymbol,
  removeConstraintSymbol,
  removeRawConstraintSymbol,
  resizeSymbol,
} from "../Miscellaneous/symbols";
import { UIConstraint } from "./UIConstraint";
import {
  resolveOrientation,
  UIConstraintOrientation,
} from "./UIConstraintOrientation";
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

export interface UIVerticalProportionParameters {
  proportion: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIConstraintOrientation;
}

export class UIVerticalProportionConstraint extends UIConstraint {
  private readonly parameters: UIVerticalProportionParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UIVerticalProportionParameters>,
  ) {
    assertSameLayer(elementOne, elementTwo);
    super(elementTwo.layer);

    this.parameters = {
      proportion: parameters?.proportion ?? 1,
      power: resolvePower(parameters?.power),
      rule: resolveRule(parameters?.rule),
      orientation: resolveOrientation(parameters?.orientation),
    };

    this.layer[addConstraintSymbol](this);

    if (
      this.parameters.orientation === UIConstraintOrientation.always ||
      this.parameters.orientation === this.layer.orientation
    ) {
      this.buildConstraints();
    }
  }

  public destroy(): void {
    this.destroyConstraints();
    this.layer[removeConstraintSymbol](this);
  }

  public [resizeSymbol](orientation: UIConstraintOrientation): void {
    if (this.parameters.orientation !== UIConstraintOrientation.always) {
      if (orientation === this.parameters.orientation) this.buildConstraints();
      else this.destroyConstraints();
    }
  }

  protected buildConstraints(): void {
    const expressionOne = new Expression(
      this.elementOne[heightSymbol],
    ).multiply(this.parameters.proportion);
    const expressionTwo = new Expression(this.elementTwo[heightSymbol]);

    this.constraint = new Constraint(
      expressionOne.minus(expressionTwo),
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

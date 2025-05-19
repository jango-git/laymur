import { Constraint, Expression } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";
import { assertSameLayer } from "../Miscellaneous/asserts";
import {
  addConstraintSymbol,
  addRawConstraintSymbol,
  removeConstraintSymbol,
  removeRawConstraintSymbol,
  resizeSymbol,
  widthSymbol,
  xSymbol,
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

export interface UIHorizontalDistanceParameters {
  anchorOne: number;
  anchorTwo: number;
  distance: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIOrientation;
}

export class UIHorizontalDistanceConstraint extends UIConstraint {
  private readonly parameters: UIHorizontalDistanceParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UIHorizontalDistanceParameters>,
  ) {
    super(elementTwo.layer);
    assertSameLayer(elementOne, elementTwo);

    this.parameters = {
      anchorOne: parameters?.anchorOne ?? 0.5,
      anchorTwo: parameters?.anchorTwo ?? 0.5,
      distance: parameters?.distance ?? 0,
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
    const expressionOne = new Expression(this.elementOne[xSymbol]).plus(
      new Expression(this.elementOne[widthSymbol]).multiply(
        this.parameters.anchorOne,
      ),
    );

    const expressionTwo = new Expression(this.elementTwo[xSymbol]).plus(
      new Expression(this.elementTwo[widthSymbol]).multiply(
        this.parameters.anchorTwo,
      ),
    );

    this.constraint = new Constraint(
      expressionTwo.minus(expressionOne),
      convertRuleToOperator(this.parameters.rule),
      this.parameters.distance,
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

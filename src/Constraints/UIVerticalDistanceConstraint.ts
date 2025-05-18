import { Constraint, Expression, Operator } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";
import { assertSameLayer } from "../Miscellaneous/asserts";
import {
  addConstraint,
  addRawConstraint,
  hSymbol,
  layerSymbol,
  removeConstraint,
  removeRawConstraint,
  resizeSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import { UIConstraint } from "./UIConstraint";
import {
  resolveOrientation,
  UIConstraintOrientation,
} from "./UIConstraintOrientation";
import { powerToStrength, UIConstraintPower } from "./UIConstraintPower";
import { ruleToOperator, UIConstraintRule } from "./UIConstraintRule";

export interface UIVerticalDistanceParameters {
  anchorOne: number;
  anchorTwo: number;
  distance: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIConstraintOrientation;
}

interface InnerParameters {
  anchorOne: number;
  anchorTwo: number;
  distance: number;
  strength: number;
  operator: Operator;
  orientation: UIConstraintOrientation;
}

export class UIVerticalDistanceConstraint extends UIConstraint {
  private readonly parameters: InnerParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UIVerticalDistanceParameters>,
  ) {
    super();
    assertSameLayer(elementOne, elementTwo);

    this.parameters = {
      anchorOne: parameters?.anchorOne ?? 0.5,
      anchorTwo: parameters?.anchorTwo ?? 0.5,
      distance: parameters?.distance ?? 0,
      strength: powerToStrength(parameters?.power),
      operator: ruleToOperator(parameters?.rule),
      orientation: resolveOrientation(parameters?.orientation),
    };
    this.elementTwo[layerSymbol][addConstraint](this);
    if (
      this.elementTwo[layerSymbol].orientation & this.parameters.orientation
    ) {
      this.rebuildConstraints();
    }
  }

  public get distance(): number {
    return this.parameters.distance;
  }

  public set distance(value: number) {
    if (value === this.parameters.distance) return;
    this.parameters.distance = value;
    this.rebuildConstraints();
  }

  public destroy(): void {
    this.destroyConstraints();
    this.elementTwo[layerSymbol][removeConstraint](this);
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
      this.elementTwo[layerSymbol][removeRawConstraint](this.constraint);
      this.constraint = undefined;
    }
  }

  private rebuildConstraints(): void {
    this.destroyConstraints();

    const expressionOne = new Expression(this.elementOne[ySymbol]).plus(
      new Expression(this.elementOne[hSymbol]).multiply(
        this.parameters.anchorOne,
      ),
    );

    const expressionTwo = new Expression(this.elementTwo[ySymbol]).plus(
      new Expression(this.elementTwo[hSymbol]).multiply(
        this.parameters.anchorTwo,
      ),
    );

    this.constraint = new Constraint(
      expressionTwo.minus(expressionOne),
      this.parameters.operator,
      this.parameters.distance,
      this.parameters.strength,
    );

    this.elementTwo[layerSymbol][addRawConstraint](this.constraint);
  }
}

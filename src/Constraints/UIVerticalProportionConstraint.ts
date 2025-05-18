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
} from "../Miscellaneous/symbols";
import { UIConstraint } from "./UIConstraint";
import {
  resolveOrientation,
  UIConstraintOrientation,
} from "./UIConstraintOrientation";
import { powerToStrength, UIConstraintPower } from "./UIConstraintPower";
import { ruleToOperator, UIConstraintRule } from "./UIConstraintRule";

export interface UIVerticalProportionParameters {
  proportion: number;
  power: UIConstraintPower;
  rule: UIConstraintRule;
  orientation: UIConstraintOrientation;
}

interface InnerParameters {
  proportion: number;
  strength: number;
  operator: Operator;
  orientation: UIConstraintOrientation;
}

export class UIVerticalProportionConstraint extends UIConstraint {
  private readonly parameters: InnerParameters;
  private constraint?: Constraint;

  public constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UIVerticalProportionParameters>,
  ) {
    super();
    assertSameLayer(elementOne, elementTwo);

    this.parameters = {
      proportion: parameters?.proportion ?? 1,
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

  public get proportion(): number {
    return this.parameters.proportion;
  }

  public set proportion(value: number) {
    if (value === this.parameters.proportion) return;
    this.parameters.proportion = value;
    this.rebuildConstraints();
  }

  public destroy(): void {
    this.destroyConstraints();
    this.elementTwo[layerSymbol][removeConstraint](this);
  }

  [resizeSymbol](orientation: UIConstraintOrientation): void {
    if (this.parameters.orientation !== UIConstraintOrientation.always) {
      if (orientation & this.parameters.orientation) this.rebuildConstraints();
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

    const expressionOne = new Expression(this.elementOne[hSymbol]).multiply(
      this.parameters.proportion,
    );
    const expressionTwo = new Expression(this.elementTwo[hSymbol]);

    this.constraint = new Constraint(
      expressionOne.minus(expressionTwo),
      this.parameters.operator,
      0,
      this.parameters.strength,
    );

    this.elementTwo[layerSymbol][addRawConstraint](this.constraint);
  }
}

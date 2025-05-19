import { Constraint, Expression, Operator, Strength } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import type { UILayer } from "../Layers/UILayer";
import { assertSameLayer } from "../Miscellaneous/asserts";
import {
  addConstraintSymbol,
  disableConstraintSymbol,
  enableConstraintSymbol,
  heightSymbol,
  removeConstraintSymbol,
  widthSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import {
  resolveOrientation,
  UIOrientation,
} from "../Miscellaneous/UIOrientation";
import { UIConstraint } from "./UIConstraint";

export interface UICoverParameters {
  isStrict: boolean;
  horizontalAnchor: number;
  verticalAnchor: number;
  orientation: UIOrientation;
}

export class UICoverConstraint extends UIConstraint {
  private readonly parameters: UICoverParameters;

  private constraintX?: Constraint;
  private constraintY?: Constraint;
  private constraintW?: Constraint;
  private constraintH?: Constraint;
  private constraintStrict?: Constraint;

  constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UICoverParameters>,
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
      isStrict: parameters?.isStrict ?? true,
      horizontalAnchor: parameters?.horizontalAnchor ?? 0.5,
      verticalAnchor: parameters?.verticalAnchor ?? 0.5,
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

  public [disableConstraintSymbol](orientation: UIOrientation): void {
    if (
      this.parameters.orientation !== UIOrientation.ALWAYS &&
      orientation !== this.parameters.orientation
    ) {
      this.destroyConstraints();
    }
  }

  public [enableConstraintSymbol](orientation: UIOrientation): void {
    if (
      this.parameters.orientation !== UIOrientation.ALWAYS &&
      orientation === this.parameters.orientation
    ) {
      this.buildConstraints();
    }
  }

  protected buildConstraints(): void {
    this.constraintX = new Constraint(
      new Expression(this.elementOne[xSymbol]).plus(
        new Expression(this.elementOne[widthSymbol]).multiply(
          this.parameters.horizontalAnchor,
        ),
      ),
      Operator.Eq,
      new Expression(this.elementTwo[xSymbol]).plus(
        new Expression(this.elementTwo[widthSymbol]).multiply(
          this.parameters.horizontalAnchor,
        ),
      ),
    );

    this.constraintY = new Constraint(
      new Expression(this.elementOne[ySymbol]).plus(
        new Expression(this.elementOne[heightSymbol]).multiply(
          this.parameters.verticalAnchor,
        ),
      ),
      Operator.Eq,
      new Expression(this.elementTwo[ySymbol]).plus(
        new Expression(this.elementTwo[heightSymbol]).multiply(
          this.parameters.verticalAnchor,
        ),
      ),
    );

    this.constraintW = new Constraint(
      new Expression(this.elementOne[widthSymbol]),
      Operator.Le,
      new Expression(this.elementTwo[widthSymbol]),
    );

    this.constraintH = new Constraint(
      new Expression(this.elementOne[heightSymbol]),
      Operator.Le,
      new Expression(this.elementTwo[heightSymbol]),
    );

    this.layer[addConstraintSymbol](this, this.constraintX);
    this.layer[addConstraintSymbol](this, this.constraintY);

    this.layer[addConstraintSymbol](this, this.constraintW);
    this.layer[addConstraintSymbol](this, this.constraintH);

    if (!this.parameters.isStrict) {
      this.constraintStrict = new Constraint(
        new Expression(this.elementOne[heightSymbol]),
        Operator.Eq,
        new Expression(this.elementTwo[heightSymbol]),
        Strength.strong,
      );

      this.layer[addConstraintSymbol](this, this.constraintStrict);
    }
  }

  protected destroyConstraints(): void {
    if (this.constraintX) {
      this.layer[removeConstraintSymbol](this, this.constraintX);
      this.constraintX = undefined;
    }
    if (this.constraintY) {
      this.layer[removeConstraintSymbol](this, this.constraintY);
      this.constraintY = undefined;
    }
    if (this.constraintW) {
      this.layer[removeConstraintSymbol](this, this.constraintW);
      this.constraintW = undefined;
    }
    if (this.constraintH) {
      this.layer[removeConstraintSymbol](this, this.constraintH);
      this.constraintH = undefined;
    }
    if (this.constraintStrict) {
      this.layer[removeConstraintSymbol](this, this.constraintStrict);
      this.constraintStrict = undefined;
    }
  }
}

import { Constraint, Expression, Operator, Strength } from "kiwi.js";
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
  widthSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import {
  resolveOrientation,
  UIOrientation,
} from "../Miscellaneous/UIOrientation";
import { UIConstraint } from "./UIConstraint";

export interface UIFitParameters {
  isStrict: boolean;
  horizontalAnchor: number;
  verticalAnchor: number;
  orientation: UIOrientation;
}

export class UIFitConstraint extends UIConstraint {
  private readonly parameters: UIFitParameters;

  private constraintX?: Constraint;
  private constraintY?: Constraint;

  private constraintW?: Constraint;
  private constraintH?: Constraint;

  private constraintStrict?: Constraint;

  public constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UIFitParameters>,
  ) {
    super(elementTwo.layer);
    assertSameLayer(elementOne, elementTwo);

    this.parameters = {
      isStrict: parameters?.isStrict ?? true,
      horizontalAnchor: parameters?.horizontalAnchor ?? 0.5,
      verticalAnchor: parameters?.verticalAnchor ?? 0.5,
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

  [resizeSymbol](orientation: UIOrientation): void {
    if (this.parameters.orientation !== UIOrientation.always) {
      if (orientation === this.parameters.orientation) this.buildConstraints();
      else this.destroyConstraints();
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
      Operator.Ge,
      new Expression(this.elementTwo[widthSymbol]),
    );

    this.constraintH = new Constraint(
      new Expression(this.elementOne[heightSymbol]),
      Operator.Ge,
      new Expression(this.elementTwo[heightSymbol]),
    );

    this.layer[addRawConstraintSymbol](this.constraintX);
    this.layer[addRawConstraintSymbol](this.constraintY);

    this.layer[addRawConstraintSymbol](this.constraintW);
    this.layer[addRawConstraintSymbol](this.constraintH);

    if (this.parameters.isStrict !== false) {
      this.constraintStrict = new Constraint(
        new Expression(this.elementOne[heightSymbol]),
        Operator.Eq,
        new Expression(this.elementTwo[heightSymbol]),
        Strength.strong,
      );

      this.layer[addRawConstraintSymbol](this.constraintStrict);
    }
  }

  protected destroyConstraints(): void {
    if (this.constraintX) {
      this.layer[removeRawConstraintSymbol](this.constraintX);
      this.constraintX = undefined;
    }
    if (this.constraintY) {
      this.layer[removeRawConstraintSymbol](this.constraintY);
      this.constraintY = undefined;
    }
    if (this.constraintW) {
      this.layer[removeRawConstraintSymbol](this.constraintW);
      this.constraintW = undefined;
    }
    if (this.constraintH) {
      this.layer[removeRawConstraintSymbol](this.constraintH);
      this.constraintH = undefined;
    }
    if (this.constraintStrict) {
      this.layer[removeRawConstraintSymbol](this.constraintStrict);
      this.constraintStrict = undefined;
    }
  }
}

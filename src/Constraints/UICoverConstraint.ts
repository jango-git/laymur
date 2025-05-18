import { Constraint, Expression, Operator, Strength } from "kiwi.js";
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
  wSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import { UIConstraint } from "./UIConstraint";
import { UIConstraintOrientation } from "./UIConstraintOrientation";

export interface UICoverParameters {
  isStrict: boolean;
  horizontalAnchor: number;
  verticalAnchor: number;
  orientation: UIConstraintOrientation;
}

export class UICoverConstraint extends UIConstraint {
  private readonly parameters: UICoverParameters;

  private constraintX?: Constraint;
  private constraintY?: Constraint;

  private constraintW?: Constraint;
  private constraintH?: Constraint;

  private constraintStrict?: Constraint;

  public constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UICoverParameters>,
  ) {
    super();
    assertSameLayer(elementOne, elementTwo);

    this.parameters = {
      isStrict: parameters?.isStrict ?? true,
      horizontalAnchor: parameters?.horizontalAnchor ?? 0.5,
      verticalAnchor: parameters?.verticalAnchor ?? 0.5,
      orientation: parameters?.orientation ?? UIConstraintOrientation.always,
    };
    this.elementTwo[layerSymbol][addConstraint](this);
    if (
      this.elementTwo[layerSymbol].orientation & this.parameters.orientation
    ) {
      this.rebuildConstraints();
    }
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
    if (this.constraintX) {
      this.elementTwo[layerSymbol][removeRawConstraint](this.constraintX);
      this.constraintX = undefined;
    }
    if (this.constraintY) {
      this.elementTwo[layerSymbol][removeRawConstraint](this.constraintY);
      this.constraintY = undefined;
    }
    if (this.constraintW) {
      this.elementTwo[layerSymbol][removeRawConstraint](this.constraintW);
      this.constraintW = undefined;
    }
    if (this.constraintH) {
      this.elementTwo[layerSymbol][removeRawConstraint](this.constraintH);
      this.constraintH = undefined;
    }
    if (this.constraintStrict) {
      this.elementTwo[layerSymbol][removeRawConstraint](this.constraintStrict);
      this.constraintStrict = undefined;
    }
  }

  private rebuildConstraints(): void {
    this.destroyConstraints();

    this.constraintX = new Constraint(
      new Expression(this.elementOne[xSymbol]).plus(
        new Expression(this.elementOne[wSymbol]).multiply(
          this.parameters.horizontalAnchor,
        ),
      ),
      Operator.Eq,
      new Expression(this.elementTwo[xSymbol]).plus(
        new Expression(this.elementTwo[wSymbol]).multiply(
          this.parameters.horizontalAnchor,
        ),
      ),
    );

    this.constraintY = new Constraint(
      new Expression(this.elementOne[ySymbol]).plus(
        new Expression(this.elementOne[hSymbol]).multiply(
          this.parameters.verticalAnchor,
        ),
      ),
      Operator.Eq,
      new Expression(this.elementTwo[ySymbol]).plus(
        new Expression(this.elementTwo[hSymbol]).multiply(
          this.parameters.verticalAnchor,
        ),
      ),
    );

    this.constraintW = new Constraint(
      new Expression(this.elementOne[wSymbol]),
      Operator.Le,
      new Expression(this.elementTwo[wSymbol]),
    );

    this.constraintH = new Constraint(
      new Expression(this.elementOne[hSymbol]),
      Operator.Le,
      new Expression(this.elementTwo[hSymbol]),
    );

    this.elementTwo[layerSymbol][addRawConstraint](this.constraintX);
    this.elementTwo[layerSymbol][addRawConstraint](this.constraintY);

    this.elementTwo[layerSymbol][addRawConstraint](this.constraintW);
    this.elementTwo[layerSymbol][addRawConstraint](this.constraintH);

    if (this.parameters.isStrict !== false) {
      this.constraintStrict = new Constraint(
        new Expression(this.elementOne[hSymbol]),
        Operator.Eq,
        new Expression(this.elementTwo[hSymbol]),
        Strength.strong,
      );

      this.elementTwo[layerSymbol][addRawConstraint](this.constraintStrict);
    }
  }
}

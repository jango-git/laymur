import { Constraint, Expression, Operator, Strength } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";
import { assertSameLayer } from "../Miscellaneous/asserts";
import {
  addConstraint,
  hSymbol,
  layerSymbol,
  removeConstraint,
  wSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import { UIConstraint } from "./UIConstraint";

export interface UICoverParameters {
  isStrict: boolean;
  horizontalAnchor: number;
  verticalAnchor: number;
}

interface InnerParameters {
  isStrict: boolean;
  horizontalAnchor: number;
  verticalAnchor: number;
}

export class UICoverConstraint extends UIConstraint {
  private readonly parameters: InnerParameters;

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
    };
    this.rebuildConstraint();
  }

  public destroy(): void {
    this.destroyConstraints();
  }

  private destroyConstraints(): void {
    if (this.constraintX) {
      this.elementTwo[layerSymbol][removeConstraint](this.constraintX);
    }
    if (this.constraintY) {
      this.elementTwo[layerSymbol][removeConstraint](this.constraintY);
    }
    if (this.constraintW) {
      this.elementTwo[layerSymbol][removeConstraint](this.constraintW);
    }
    if (this.constraintH) {
      this.elementTwo[layerSymbol][removeConstraint](this.constraintH);
    }
    if (this.constraintStrict) {
      this.elementTwo[layerSymbol][removeConstraint](this.constraintStrict);
    }
  }

  private rebuildConstraint(): void {
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

    this.elementTwo[layerSymbol][addConstraint](this.constraintX);
    this.elementTwo[layerSymbol][addConstraint](this.constraintY);

    this.elementTwo[layerSymbol][addConstraint](this.constraintW);
    this.elementTwo[layerSymbol][addConstraint](this.constraintH);

    if (this.parameters.isStrict !== false) {
      this.constraintStrict = new Constraint(
        new Expression(this.elementOne[hSymbol]),
        Operator.Eq,
        new Expression(this.elementTwo[hSymbol]),
        Strength.strong,
      );

      this.elementTwo[layerSymbol][addConstraint](this.constraintStrict);
    }
  }
}

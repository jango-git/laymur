import { Constraint, Expression, Operator, Strength } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";
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
    private readonly under: UIElement | UILayer,
    private readonly over: UIElement,
    parameters?: Partial<UICoverParameters>,
  ) {
    super();
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
      this.over[layerSymbol][removeConstraint](this.constraintX);
    }
    if (this.constraintY) {
      this.over[layerSymbol][removeConstraint](this.constraintY);
    }
    if (this.constraintW) {
      this.over[layerSymbol][removeConstraint](this.constraintW);
    }
    if (this.constraintH) {
      this.over[layerSymbol][removeConstraint](this.constraintH);
    }
    if (this.constraintStrict) {
      this.over[layerSymbol][removeConstraint](this.constraintStrict);
    }
  }

  private rebuildConstraint(): void {
    this.destroyConstraints();

    this.constraintX = new Constraint(
      new Expression(this.under[xSymbol]).plus(
        new Expression(this.under[wSymbol]).multiply(
          this.parameters.horizontalAnchor,
        ),
      ),
      Operator.Eq,
      new Expression(this.over[xSymbol]).plus(
        new Expression(this.over[wSymbol]).multiply(
          this.parameters.horizontalAnchor,
        ),
      ),
    );

    this.constraintY = new Constraint(
      new Expression(this.under[ySymbol]).plus(
        new Expression(this.under[hSymbol]).multiply(
          this.parameters.verticalAnchor,
        ),
      ),
      Operator.Eq,
      new Expression(this.over[ySymbol]).plus(
        new Expression(this.over[hSymbol]).multiply(
          this.parameters.verticalAnchor,
        ),
      ),
    );

    this.constraintW = new Constraint(
      new Expression(this.under[wSymbol]),
      Operator.Le,
      new Expression(this.over[wSymbol]),
    );

    this.constraintH = new Constraint(
      new Expression(this.under[hSymbol]),
      Operator.Le,
      new Expression(this.over[hSymbol]),
    );

    this.over[layerSymbol][addConstraint](this.constraintX);
    this.over[layerSymbol][addConstraint](this.constraintY);

    this.over[layerSymbol][addConstraint](this.constraintW);
    this.over[layerSymbol][addConstraint](this.constraintH);

    if (this.parameters.isStrict !== false) {
      this.constraintStrict = new Constraint(
        new Expression(this.under[hSymbol]),
        Operator.Eq,
        new Expression(this.over[hSymbol]),
        Strength.strong,
      );

      this.over[layerSymbol][addConstraint](this.constraintStrict);
    }
  }
}

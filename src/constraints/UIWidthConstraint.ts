import type { UIElement } from "../elements/UIElement";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

export interface UIWidthConstraintOptions
  extends UISingleParameterConstraintOptions {
  width: number;
}

export class UIWidthConstraint extends UISingleParameterConstraint {
  protected override readonly constraint: number;
  private widthInternal: number;

  constructor(
    private readonly element: UIElement,
    options: Partial<UIWidthConstraintOptions> = {},
  ) {
    super(
      element.layer,
      options.priority,
      options.relation,
      options.orientation,
    );

    this.widthInternal = options.width ?? element.width;

    this.constraint = this.solverWrapper.createConstraint(
      new UIExpression(0, [[this.element.wVariable, 1]]),
      new UIExpression(this.widthInternal),
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  public get width(): number {
    return this.widthInternal;
  }

  public set width(value: number) {
    if (this.widthInternal !== value) {
      this.widthInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(value),
      );
    }
  }
}

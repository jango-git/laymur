import type { UIElement } from "../elements/UIElement";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

export interface UIHeightOptions extends UISingleParameterConstraintOptions {
  height: number;
}

export class UIHeightConstraint extends UISingleParameterConstraint {
  protected override readonly constraint: number;
  private heightInternal: number;

  constructor(
    private readonly element: UIElement,
    options: Partial<UIHeightOptions> = {},
  ) {
    super(
      element.layer,
      options.priority,
      options.relation,
      options.orientation,
    );

    this.heightInternal = options.height ?? element.height;

    const lhs = new UIExpression().plus(this.element.hVariable, 1);
    const rhs = new UIExpression(this.heightInternal);

    this.constraint = this.solverWrapper.createConstraint(
      lhs,
      rhs,
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  public get height(): number {
    return this.heightInternal;
  }

  public set height(value: number) {
    if (this.heightInternal !== value) {
      this.heightInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(value),
      );
    }
  }
}

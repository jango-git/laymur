import type { UIElement } from "../elements/UIElement";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

export interface UIHeightConstraintOptions
  extends UISingleParameterConstraintOptions {
  height: number;
}

export class UIHeightConstraint extends UISingleParameterConstraint {
  protected override readonly constraint: number;
  private heightInternal: number;

  constructor(
    private readonly element: UIElement,
    options: Partial<UIHeightConstraintOptions> = {},
  ) {
    super(
      element.layer,
      options.priority,
      options.relation,
      options.orientation,
    );

    this.heightInternal = options.height ?? element.height;

    this.constraint = this.solverWrapper.createConstraint(
      new UIExpression(0, [[this.element.hVariable, 1]]),
      new UIExpression(this.heightInternal),
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

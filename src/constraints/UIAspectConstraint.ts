import type { UIElement } from "../elements/UIElement";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

export interface UIAspectOptions extends UISingleParameterConstraintOptions {
  aspect: number;
}

export class UIHeightConstraint extends UISingleParameterConstraint {
  protected override readonly constraint: number;
  private aspectInternal: number;

  constructor(
    private readonly element: UIElement,
    options: Partial<UIAspectOptions> = {},
  ) {
    super(
      element.layer,
      options.priority,
      options.relation,
      options.orientation,
    );

    this.aspectInternal = options.aspect ?? element.width / element.height;

    const lhs = new UIExpression(0, [
      [this.element.wVariable, 1],
      [this.element.hVariable, -this.aspectInternal],
    ]);
    const rhs = new UIExpression(0);

    this.constraint = this.solverWrapper.createConstraint(
      lhs,
      rhs,
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  public get aspect(): number {
    return this.aspectInternal;
  }

  public set aspect(value: number) {
    if (this.aspectInternal !== value) {
      this.aspectInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(value),
      );
    }
  }
}

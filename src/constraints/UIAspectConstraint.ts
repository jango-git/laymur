import type { UIElement } from "../elements/UIElement";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

export interface UIAspectConstraintOptions
  extends UISingleParameterConstraintOptions {
  aspect: number;
}

export class UIAspectConstraint extends UISingleParameterConstraint {
  protected override readonly constraint: number;
  private aspectInternal: number;

  constructor(
    private readonly element: UIElement,
    options: Partial<UIAspectConstraintOptions> = {},
  ) {
    super(
      element.layer,
      options.priority,
      options.relation,
      options.orientation,
    );

    this.aspectInternal = options.aspect ?? element.width / element.height;

    this.constraint = this.solverWrapper.createConstraint(
      this.buildLHS(),
      new UIExpression(0),
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
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  private buildLHS(): UIExpression {
    return new UIExpression(0, [
      [this.element.wVariable, 1],
      [this.element.hVariable, -this.aspectInternal],
    ]);
  }
}

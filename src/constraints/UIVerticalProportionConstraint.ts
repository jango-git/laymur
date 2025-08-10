import type { UIPlaneElement } from "../miscellaneous/asserts";
import { assertValidConstraintSubjects } from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

export interface UIVerticalProportionOptions
  extends UISingleParameterConstraintOptions {
  proportion: number;
}

export class UIVerticalProportionConstraint extends UISingleParameterConstraint {
  protected override readonly constraint: number;
  private proportionInternal: number;

  constructor(
    private readonly a: UIPlaneElement,
    private readonly b: UIPlaneElement,
    options: Partial<UIVerticalProportionOptions> = {},
  ) {
    super(
      assertValidConstraintSubjects(a, b, "UIVerticalProportionConstraint"),
      options.priority,
      options.relation,
      options.orientation,
    );

    this.proportionInternal = options.proportion ?? 1;

    this.constraint = this.solverWrapper.createConstraint(
      this.buildLHS(),
      new UIExpression(0),
      this.relationInternal,
      this.priorityInternal,
      this.isConstraintEnabled(),
    );
  }

  public get proportion(): number {
    return this.proportionInternal;
  }

  public set proportion(value: number) {
    if (this.proportionInternal !== value) {
      this.proportionInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  private buildLHS(): UIExpression {
    return UIExpression.minus(
      new UIExpression(0, [[this.a.hVariable, this.proportionInternal]]),
      new UIExpression(0, [[this.b.hVariable, 1]]),
    );
  }
}

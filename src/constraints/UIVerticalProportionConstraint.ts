import type { UIPlaneElement } from "../miscellaneous/asserts";
import {
  assertValidConstraintSubjects,
  assertValidPositiveNumber,
} from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";
import type { UIVerticalProportionConstraintOptions } from "./UIVerticalProportionConstraint.Internal";

/** Maintains proportional height relationship (A.height * proportion = B.height) */
export class UIVerticalProportionConstraint extends UISingleParameterConstraint {
  protected override readonly constraint: number;
  private proportionInternal: number;

  /**
   * @param a First element
   * @param b Second element
   * @param options Proportion configuration
   */
  constructor(
    private readonly a: UIPlaneElement,
    private readonly b: UIPlaneElement,
    options: Partial<UIVerticalProportionConstraintOptions> = {},
  ) {
    super(
      assertValidConstraintSubjects(a, b, "UIVerticalProportionConstraint"),
      options,
    );

    if (options.proportion !== undefined) {
      assertValidPositiveNumber(
        options.proportion,
        "UIVerticalProportionConstraint.constructor.options.proportion",
      );
    }

    this.proportionInternal = options.proportion ?? 1;
    this.constraint = this.solverWrapper.createConstraint(
      new UIExpression(0),
      this.buildRHS(),
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  /** Current proportion multiplier */
  public get proportion(): number {
    return this.proportionInternal;
  }

  /** Updates proportion multiplier */
  public set proportion(value: number) {
    assertValidPositiveNumber(
      value,
      "UIVerticalProportionConstraint.proportion",
    );
    if (this.proportionInternal !== value) {
      this.proportionInternal = value;
      this.solverWrapper.setConstraintRHS(this.constraint, this.buildRHS());
    }
  }

  /** Builds constraint expression for proportional relationship */
  private buildRHS(): UIExpression {
    return UIExpression.minus(
      new UIExpression(0, [[this.a.hVariable, this.proportionInternal]]),
      new UIExpression(0, [[this.b.hVariable, 1]]),
    );
  }
}

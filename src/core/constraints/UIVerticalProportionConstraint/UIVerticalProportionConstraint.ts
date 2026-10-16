import {
  assertValidConstraintArguments,
  assertValidPositiveNumber,
} from "../../miscellaneous/asserts.js";
import type { UIPlaneElement } from "../../miscellaneous/shared.js";
import { UIExpression } from "../../miscellaneous/UIExpression.js";
import { UISingleParameterConstraint } from "../UISingleParameterConstraint/UISingleParameterConstraint.js";
import type { UIVerticalProportionConstraintOptions } from "./UIVerticalProportionConstraint.Internal.js";

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
    public readonly a: UIPlaneElement,
    public readonly b: UIPlaneElement,
    options: Partial<UIVerticalProportionConstraintOptions> = {},
  ) {
    if (options.proportion !== undefined) {
      assertValidPositiveNumber(
        options.proportion,
        "UIVerticalProportionConstraint.constructor.options.proportion",
      );
    }

    super(
      assertValidConstraintArguments(a, b, "UIVerticalProportionConstraint.constructor"),
      options,
    );

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
    this.assertNotDestroyed("UIVerticalProportionConstraint.proportion");
    assertValidPositiveNumber(value, "UIVerticalProportionConstraint.proportion");
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

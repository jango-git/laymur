import { assertNotDestroyed, assertValidPositiveNumber } from "../../miscellaneous/asserts.js";
import type { UIPlaneElement } from "../../miscellaneous/shared.js";
import { UIExpression } from "../../miscellaneous/UIExpression.js";
import { assertValidConstraintArguments } from "../constraintAsserts.js";
import { UISingleParameterConstraint } from "../UISingleParameterConstraint/UISingleParameterConstraint.js";
import type { UIProportionConstraintOptions } from "./UIProportionConstraint.Internal.js";
import { assertValidProportionConstraintOptions } from "./UIProportionConstraint.Internal.js";

/** Maintains proportional size relationship along one axis (size of A * proportion = size of B) */
export abstract class UIProportionConstraint extends UISingleParameterConstraint {
  protected override readonly constraint: number;
  private proportionInternal: number;

  /**
   * @param a First element
   * @param b Second element
   * @param options Proportion configuration
   * @param vertical True to relate heights, false to relate widths
   */
  constructor(
    public readonly a: UIPlaneElement,
    public readonly b: UIPlaneElement,
    options: Partial<UIProportionConstraintOptions>,
    private readonly vertical: boolean,
  ) {
    assertValidProportionConstraintOptions(options);

    super(assertValidConstraintArguments(a, b, "UIProportionConstraint.constructor"), options);

    this.proportionInternal = options.proportion ?? 1;
    this.constraint = this.solverWrapper.createConstraint(
      new UIExpression(0),
      this.buildRHS(),
      this.relation,
      this.priority,
      this.enabled,
      this,
    );
  }

  /** Current proportion multiplier */
  public get proportion(): number {
    return this.proportionInternal;
  }

  /** Updates proportion multiplier */
  public set proportion(value: number) {
    assertNotDestroyed(this, "constraint", "UIProportionConstraint.proportion");
    assertValidPositiveNumber(value, "UIProportionConstraint.proportion");
    if (this.proportionInternal !== value) {
      this.proportionInternal = value;
      this.solverWrapper.setConstraintRHS(this.constraint, this.buildRHS());
    }
  }

  /** Builds constraint expression for proportional relationship */
  private buildRHS(): UIExpression {
    const aSize = this.vertical ? this.a.hVariable : this.a.wVariable;
    const bSize = this.vertical ? this.b.hVariable : this.b.wVariable;
    return UIExpression.minus(
      new UIExpression(0, [[aSize, this.proportionInternal]]),
      new UIExpression(0, [[bSize, 1]]),
    );
  }
}

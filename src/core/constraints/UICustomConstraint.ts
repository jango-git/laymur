import type { UILayer } from "../layers/UILayer/UILayer.js";
import { assertValidConstraintExpressions } from "../miscellaneous/asserts.js";
import type { UIExpression } from "../miscellaneous/UIExpression.js";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint/UISingleParameterConstraint.js";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint/UISingleParameterConstraint.Internal.js";

/** Constraint with custom LHS and RHS expressions */
export class UICustomConstraint extends UISingleParameterConstraint {
  /** Solver constraint descriptor */
  protected override readonly constraint: number;
  /** Left-hand side expression */
  private lhsInternal: UIExpression;
  /** Right-hand side expression */
  private rhsInternal: UIExpression;

  /**
   * @param layer Layer containing this constraint
   * @param lhs Left-hand side expression
   * @param rhs Right-hand side expression
   * @param options Constraint configuration
   */
  constructor(
    layer: UILayer,
    lhs: UIExpression,
    rhs: UIExpression,
    options: Partial<UISingleParameterConstraintOptions> = {},
  ) {
    super(
      assertValidConstraintExpressions(layer, [lhs, rhs], "UICustomConstraint.constructor"),
      options,
    );

    this.lhsInternal = lhs;
    this.rhsInternal = rhs;

    this.constraint = this.solverWrapper.createConstraint(
      this.lhsInternal,
      this.rhsInternal,
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  /** Left-hand side expression */
  public get lhs(): UIExpression {
    return this.lhsInternal;
  }

  /** Right-hand side expression */
  public get rhs(): UIExpression {
    return this.rhsInternal;
  }

  /** Updates left-hand side expression */
  public setLHS(value: UIExpression): void {
    this.assertNotDestroyed("UICustomConstraint.setLHS");
    this.lhsInternal = value;
    this.solverWrapper.setConstraintLHS(this.constraint, this.lhsInternal);
  }

  /** Updates right-hand side expression */
  public setRHS(value: UIExpression): void {
    this.assertNotDestroyed("UICustomConstraint.setRHS");
    this.rhsInternal = value;
    this.solverWrapper.setConstraintRHS(this.constraint, this.rhsInternal);
  }
}

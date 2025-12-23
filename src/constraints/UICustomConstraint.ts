import type { UILayer } from "../layers/UILayer/UILayer";
import type { UIExpression } from "../miscellaneous/UIExpression";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint/UISingleParameterConstraint";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint/UISingleParameterConstraint.Internal";

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
    super(layer, options);

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
    this.lhsInternal = value;
    this.solverWrapper.setConstraintLHS(this.constraint, this.lhsInternal);
  }

  /** Updates right-hand side expression */
  public setRHS(value: UIExpression): void {
    this.rhsInternal = value;
    this.solverWrapper.setConstraintRHS(this.constraint, this.rhsInternal);
  }
}

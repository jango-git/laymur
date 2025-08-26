import type { UILayer } from "../layers/UILayer";
import type { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/**
 * Constraint that allows custom mathematical relationships between UI elements.
 *
 * Allows direct specification of left-hand side (LHS) and right-hand side (RHS)
 * expressions for constraint equations. The constraint equation is:
 * LHS relation RHS (e.g., LHS = RHS, LHS ≤ RHS, or LHS ≥ RHS)
 *
 * Useful for custom layout logic or relationships not covered by specialized
 * constraint types.
 *
 * @public
 */
export class UICustomConstraint extends UISingleParameterConstraint {
  /** @internal */
  protected override readonly constraint: number;
  /** @internal */
  private lhsInternal: UIExpression;
  /** @internal */
  private rhsInternal: UIExpression;

  /**
   * Creates a custom constraint with specified expressions.
   *
   * Enforces the relationship: LHS relation RHS, where the relation is
   * determined by the options (defaults to equality).
   *
   * @param layer - UI layer that contains this constraint
   * @param lhs - Left-hand side expression
   * @param rhs - Right-hand side expression
   * @param options - Configuration options
   */
  constructor(
    layer: UILayer,
    lhs: UIExpression,
    rhs: UIExpression,
    options: Partial<UISingleParameterConstraintOptions> = {},
  ) {
    super(layer, options.priority, options.relation, options.orientation);

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

  /**
   * Gets the left-hand side expression.
   *
   * @returns LHS expression
   */
  public get lhs(): UIExpression {
    return this.lhsInternal;
  }

  /**
   * Gets the right-hand side expression.
   *
   * @returns RHS expression
   */
  public get rhs(): UIExpression {
    return this.rhsInternal;
  }

  /**
   * Sets the left-hand side expression and updates the constraint.
   *
   * @param value - New LHS expression
   */
  public setLHS(value: UIExpression): void {
    this.lhsInternal = value;
    this.solverWrapper.setConstraintLHS(this.constraint, this.lhsInternal);
  }

  /**
   * Sets the right-hand side expression and updates the constraint.
   *
   * @param value - New RHS expression
   */
  public setRHS(value: UIExpression): void {
    this.rhsInternal = value;
    this.solverWrapper.setConstraintRHS(this.constraint, this.rhsInternal);
  }
}

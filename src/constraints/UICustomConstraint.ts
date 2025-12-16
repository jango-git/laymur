import type { UILayer } from "../layers/UILayer";
import type { UIExpression } from "../miscellaneous/UIExpression";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

/**
 * Constraint that allows custom mathematical relationships between UI elements.
 *
 * UICustomConstraint provides maximum flexibility by allowing direct specification
 * of the left-hand side (LHS) and right-hand side (RHS) expressions for constraint
 * equations. This enables creation of complex mathematical relationships that may
 * not be covered by the specialized constraint types. The constraint equation is:
 * LHS relation RHS (e.g., LHS = RHS, LHS ≤ RHS, or LHS ≥ RHS)
 *
 * This is useful for implementing custom layout logic, complex mathematical
 * relationships between multiple elements, or prototype new constraint types.
 *
 * @see {@link UISingleParameterConstraint} - Base class for single-parameter constraints
 * @see {@link UIExpression} - Mathematical expressions for constraint equations
 * @see {@link UILayer} - Container layer for constraints
 */
export class UICustomConstraint extends UISingleParameterConstraint {
  /** The constraint descriptor managed by the solver system. */
  protected override readonly constraint: number;
  /** Internal storage for the left-hand side expression. */
  private lhsInternal: UIExpression;
  /** Internal storage for the right-hand side expression. */
  private rhsInternal: UIExpression;

  /**
   * Creates a new UICustomConstraint instance with custom expressions.
   *
   * The constraint will enforce the relationship: LHS relation RHS, where
   * the relation is determined by the options (defaults to equality).
   *
   * @param layer - The UI layer that contains this constraint
   * @param lhs - The left-hand side expression of the constraint equation
   * @param rhs - The right-hand side expression of the constraint equation
   * @param options - Configuration options for the constraint
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

  /**
   * Gets the current left-hand side expression.
   * @returns The LHS expression of the constraint equation
   */
  public get lhs(): UIExpression {
    return this.lhsInternal;
  }

  /**
   * Gets the current right-hand side expression.
   * @returns The RHS expression of the constraint equation
   */
  public get rhs(): UIExpression {
    return this.rhsInternal;
  }

  /**
   * Sets a new left-hand side expression and updates the constraint.
   * @param value - The new LHS expression for the constraint equation
   */
  public setLHS(value: UIExpression): void {
    this.lhsInternal = value;
    this.solverWrapper.setConstraintLHS(this.constraint, this.lhsInternal);
  }

  /**
   * Sets a new right-hand side expression and updates the constraint.
   * @param value - The new RHS expression for the constraint equation
   */
  public setRHS(value: UIExpression): void {
    this.rhsInternal = value;
    this.solverWrapper.setConstraintRHS(this.constraint, this.rhsInternal);
  }
}

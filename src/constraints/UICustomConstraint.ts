import type { UILayer } from "../layers/UILayer";
import type { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

export class UICustomConstraint extends UISingleParameterConstraint {
  protected override readonly constraint: number;
  private lhsInternal: UIExpression;
  private rhsInternal: UIExpression;

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

  public get lhs(): UIExpression {
    return this.lhsInternal;
  }

  public get rhs(): UIExpression {
    return this.rhsInternal;
  }

  public setLHS(value: UIExpression): void {
    this.lhsInternal = value;
    this.solverWrapper.setConstraintLHS(this.constraint, this.lhsInternal);
  }

  public setRHS(value: UIExpression): void {
    this.rhsInternal = value;
    this.solverWrapper.setConstraintRHS(this.constraint, this.rhsInternal);
  }
}

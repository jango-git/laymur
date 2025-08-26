import type { UIPlaneElement } from "../miscellaneous/asserts";
import { assertValidConstraintSubjects } from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/**
 * Configuration options for UIVerticalProportionConstraint creation.
 *
 * @public
 */
export interface UIVerticalProportionConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The proportional relationship between element heights (elementA.height * proportion = elementB.height). */
  proportion: number;
}

/**
 * Constraint that enforces proportional height relationships between two UI elements.
 *
 * Creates the relationship: elementA.height * proportion = elementB.height.
 * Useful for maintaining height ratios in responsive layouts.
 *
 * @public
 */
export class UIVerticalProportionConstraint extends UISingleParameterConstraint {
  /** @internal */
  protected override readonly constraint: number;
  /** @internal */
  private proportionInternal: number;

  /**
   * Creates a vertical proportion constraint.
   *
   * Enforces the relationship: elementA.height * proportion = elementB.height.
   * Defaults to 1.0 (equal heights) if no proportion is specified.
   * Both elements must be from the same layer.
   *
   * @param a - First UI plane element (whose height will be multiplied by proportion)
   * @param b - Second UI plane element (target height for the proportion)
   * @param options - Configuration options
   * @throws Error when elements are not from the same layer
   */
  constructor(
    private readonly a: UIPlaneElement,
    private readonly b: UIPlaneElement,
    options: Partial<UIVerticalProportionConstraintOptions> = {},
  ) {
    super(
      assertValidConstraintSubjects(a, b, "UIVerticalProportionConstraint"),
      options.priority,
      options.relation,
      options.orientation,
    );

    this.proportionInternal = options.proportion ?? 1;

    this.constraint = this.solverWrapper.createConstraint(
      new UIExpression(0),
      this.buildRHS(),
      this.relationInternal,
      this.priorityInternal,
      this.isConstraintEnabled(),
    );
  }

  /**
   * Gets the proportion value.
   *
   * @returns Proportion ratio (elementA.height * proportion = elementB.height)
   */
  public get proportion(): number {
    return this.proportionInternal;
  }

  /**
   * Sets the proportion value and updates the constraint.
   *
   * @param value - New proportion ratio
   */
  public set proportion(value: number) {
    if (this.proportionInternal !== value) {
      this.proportionInternal = value;
      this.solverWrapper.setConstraintRHS(this.constraint, this.buildRHS());
    }
  }

  /**
   * Builds the constraint expression: (elementA.height * proportion) - elementB.height = 0
   *
   * @returns Constraint expression
   * @internal
   */
  private buildRHS(): UIExpression {
    return UIExpression.minus(
      new UIExpression(0, [[this.a.hVariable, this.proportionInternal]]),
      new UIExpression(0, [[this.b.hVariable, 1]]),
    );
  }
}

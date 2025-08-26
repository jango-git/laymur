import type { UIPlaneElement } from "../miscellaneous/asserts";
import { assertValidConstraintSubjects } from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/**
 * Configuration options for UIHorizontalProportionConstraint creation.
 *
 * @public
 */
export interface UIHorizontalProportionConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The proportional relationship between element widths (elementA.width * proportion = elementB.width). */
  proportion: number;
}

/**
 * Constraint that enforces proportional width relationships between two UI elements.
 *
 * Creates the relationship: elementA.width * proportion = elementB.width.
 * Useful for maintaining width ratios in responsive layouts.
 *
 * @public
 */
export class UIHorizontalProportionConstraint extends UISingleParameterConstraint {
  /** @internal */
  protected override readonly constraint: number;
  /** @internal */
  private proportionInternal: number;

  /**
   * Creates a horizontal proportion constraint.
   *
   * Enforces the relationship: elementA.width * proportion = elementB.width.
   * Defaults to 1.0 (equal widths) if no proportion is specified.
   * Both elements must be from the same layer.
   *
   * @param a - First UI plane element (whose width will be multiplied by proportion)
   * @param b - Second UI plane element (target width for the proportion)
   * @param options - Configuration options
   * @throws Error when elements are not from the same layer
   */
  constructor(
    private readonly a: UIPlaneElement,
    private readonly b: UIPlaneElement,
    options: Partial<UIHorizontalProportionConstraintOptions> = {},
  ) {
    super(
      assertValidConstraintSubjects(a, b, "UIHorizontalProportionConstraint"),
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
   * @returns Proportion ratio (elementA.width * proportion = elementB.width)
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
   * Builds the constraint expression: (elementA.width * proportion) - elementB.width = 0
   *
   * @returns Constraint expression
   * @internal
   */
  private buildRHS(): UIExpression {
    return UIExpression.minus(
      new UIExpression(0, [[this.a.wVariable, this.proportionInternal]]),
      new UIExpression(0, [[this.b.wVariable, 1]]),
    );
  }
}

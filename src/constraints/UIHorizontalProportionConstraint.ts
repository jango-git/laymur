import type { UIPlaneElement } from "../miscellaneous/asserts";
import { assertValidConstraintSubjects } from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/**
 * Configuration options for UIHorizontalProportionConstraint creation.
 */
export interface UIHorizontalProportionConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The proportional relationship between element widths (elementA.width = elementB.width * proportion). */
  proportion: number;
}

/**
 * Constraint that enforces proportional width relationships between two UI elements.
 *
 * UIHorizontalProportionConstraint creates a mathematical relationship that maintains
 * a proportional ratio between the widths of two plane elements. The constraint equation is:
 * elementA.width * proportion = elementB.width, which can be rearranged as:
 * elementA.width * proportion - elementB.width = 0
 *
 * This is useful for creating responsive layouts where elements need to maintain
 * specific width ratios, such as sidebar-to-content ratios or grid column proportions.
 *
 * @see {@link UISingleParameterConstraint} - Base class for single-parameter constraints
 * @see {@link UIPlaneElement} - Plane elements that can have proportional constraints applied
 * @see {@link UIExpression} - Mathematical expressions for constraint equations
 */
export class UIHorizontalProportionConstraint extends UISingleParameterConstraint {
  /** The constraint descriptor managed by the solver system. */
  protected override readonly constraint: number;
  /** Internal storage for the current proportion value. */
  private proportionInternal: number;

  /**
   * Creates a new UIHorizontalProportionConstraint instance.
   *
   * The constraint will enforce the relationship: elementA.width * proportion = elementB.width.
   * If no proportion is specified, it defaults to 1.0 (equal widths).
   * Both elements must be from the same layer.
   *
   * @param a - The first UI plane element (whose width will be multiplied by proportion)
   * @param b - The second UI plane element (target width for the proportion)
   * @param options - Configuration options for the constraint
   * @throws Will throw an error if elements are not from the same layer
   * @see {@link assertValidConstraintSubjects}
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
      this.buildLHS(),
      new UIExpression(0),
      this.relationInternal,
      this.priorityInternal,
      this.isConstraintEnabled(),
    );
  }

  /**
   * Gets the current proportion value being enforced.
   * @returns The proportion ratio (elementA.width = elementB.width * proportion)
   */
  public get proportion(): number {
    return this.proportionInternal;
  }

  /**
   * Sets a new proportion value and updates the constraint equation.
   * @param value - The new proportion ratio
   */
  public set proportion(value: number) {
    if (this.proportionInternal !== value) {
      this.proportionInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /**
   * Builds the left-hand side expression for the constraint equation.
   *
   * Creates the expression: (elementA.width * proportion) - elementB.width = 0
   * This enforces the relationship: elementA.width * proportion = elementB.width
   *
   * @returns The UIExpression representing the proportional width relationship
   * @private
   */
  private buildLHS(): UIExpression {
    return UIExpression.minus(
      new UIExpression(0, [[this.a.wVariable, this.proportionInternal]]),
      new UIExpression(0, [[this.b.wVariable, 1]]),
    );
  }
}

import type { UIPlaneElement } from "../miscellaneous/asserts";
import { assertValidConstraintSubjects } from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/**
 * Configuration options for UIVerticalProportionConstraint creation.
 */
export interface UIVerticalProportionConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The proportional relationship between element heights (elementA.height * proportion = elementB.height). */
  proportion: number;
}

/**
 * Constraint that enforces proportional height relationships between two UI elements.
 *
 * UIVerticalProportionConstraint creates a mathematical relationship that maintains
 * a proportional ratio between the heights of two plane elements. The constraint equation is:
 * elementA.height * proportion = elementB.height, which can be rearranged as:
 * elementA.height * proportion - elementB.height = 0
 *
 * This is useful for creating responsive layouts where elements need to maintain
 * specific height ratios, such as header-to-content ratios or row height proportions.
 *
 * @see {@link UISingleParameterConstraint} - Base class for single-parameter constraints
 * @see {@link UIPlaneElement} - Plane elements that can have proportional constraints applied
 * @see {@link UIExpression} - Mathematical expressions for constraint equations
 */
export class UIVerticalProportionConstraint extends UISingleParameterConstraint {
  /** The constraint descriptor managed by the solver system. */
  protected override readonly constraint: number;
  /** Internal storage for the current proportion value. */
  private proportionInternal: number;

  /**
   * Creates a new UIVerticalProportionConstraint instance.
   *
   * The constraint will enforce the relationship: elementA.height * proportion = elementB.height.
   * If no proportion is specified, it defaults to 1.0 (equal heights).
   * Both elements must be from the same layer.
   *
   * @param a - The first UI plane element (whose height will be multiplied by proportion)
   * @param b - The second UI plane element (target height for the proportion)
   * @param options - Configuration options for the constraint
   * @throws Will throw an error if elements are not from the same layer
   * @see {@link assertValidConstraintSubjects}
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
   * Gets the current proportion value being enforced.
   * @returns The proportion ratio (elementA.height * proportion = elementB.height)
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
      this.solverWrapper.setConstraintRHS(this.constraint, this.buildRHS());
    }
  }

  /**
   * Builds the right-hand side expression for the constraint equation.
   *
   * Creates the expression: (elementA.height * proportion) - elementB.height = 0
   * This enforces the relationship: elementA.height * proportion = elementB.height
   *
   * @returns The UIExpression representing the proportional height relationship
   */
  private buildRHS(): UIExpression {
    return UIExpression.minus(
      new UIExpression(0, [[this.a.hVariable, this.proportionInternal]]),
      new UIExpression(0, [[this.b.hVariable, 1]]),
    );
  }
}

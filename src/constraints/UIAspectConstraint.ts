import type { UILayerElement, UIPlaneElement } from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UIAspectConstraintOptions } from "./UIAspectConstraint.Internal";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/**
 * Constraint that maintains a specific aspect ratio for UI elements.
 *
 * UIAspectConstraint enforces a mathematical relationship between an element's
 * width and height to maintain a constant aspect ratio. The constraint equation
 * is: width = height * aspect. This is useful for ensuring elements maintain
 * their proportions during layout changes or for enforcing specific aspect
 * ratios like 16:9 for video content.
 *
 * @see {@link UISingleParameterConstraint} - Base class for single-parameter constraints
 * @see {@link UIPlaneElement} - Elements that can have aspect constraints applied
 * @see {@link UIExpression} - Mathematical expressions for constraint equations
 */
export class UIAspectConstraint extends UISingleParameterConstraint {
  /** The constraint descriptor managed by the solver system. */
  protected override readonly constraint: number;

  /** Internal storage for the current aspect ratio value. */
  private aspectInternal: number;

  /**
   * Creates a new UIAspectConstraint instance.
   *
   * If no aspect ratio is specified in options, the constraint will use the
   * element's current width-to-height ratio as the target aspect ratio.
   *
   * @param element - The UI element to apply the aspect constraint to
   * @param options - Configuration options for the constraint
   */
  constructor(
    private readonly element: UIPlaneElement & UILayerElement,
    options: Partial<UIAspectConstraintOptions> = {},
  ) {
    super(
      element.layer,
      options.priority,
      options.relation,
      options.orientation,
    );

    this.aspectInternal = options.aspect ?? element.width / element.height;

    this.constraint = this.solverWrapper.createConstraint(
      this.buildLHS(),
      new UIExpression(0),
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  /**
   * Gets the current aspect ratio being enforced.
   * @returns The aspect ratio (width/height)
   */
  public get aspect(): number {
    return this.aspectInternal;
  }

  /**
   * Sets a new aspect ratio and updates the constraint equation.
   * @param value - The new aspect ratio (width/height)
   */
  public set aspect(value: number) {
    if (this.aspectInternal !== value) {
      this.aspectInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /**
   * Builds the left-hand side expression for the constraint equation.
   *
   * Creates the expression: width - (height * aspect) = 0
   * This enforces the relationship: width = height * aspect
   *
   * @returns The UIExpression representing the constraint equation
   */
  private buildLHS(): UIExpression {
    return new UIExpression(0, [
      [this.element.wVariable, 1],
      [this.element.hVariable, -this.aspectInternal],
    ]);
  }
}

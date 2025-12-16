import type { UILayerElement, UIPlaneElement } from "../miscellaneous/asserts";
import { assertValidPositiveNumber } from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";
import type { UIWidthConstraintOptions } from "./UIWidthConstraint.Internal";

/**
 * Constraint that enforces a specific width value for UI elements.
 *
 * UIWidthConstraint creates a mathematical relationship that fixes an element's
 * width to a constant value. The constraint equation is: element.width = width.
 * This is useful for ensuring elements maintain a specific width regardless of
 * other layout changes or for setting fixed dimensions in responsive layouts.
 *
 * @see {@link UISingleParameterConstraint} - Base class for single-parameter constraints
 * @see {@link UIPlaneElement} - Elements that can have width constraints applied
 * @see {@link UIExpression} - Mathematical expressions for constraint equations
 */
export class UIWidthConstraint extends UISingleParameterConstraint {
  /** The constraint descriptor managed by the solver system. */
  protected override readonly constraint: number;

  /** Internal storage for the current width value. */
  private widthInternal: number;

  /**
   * Creates a new UIWidthConstraint instance.
   *
   * If no width is specified in options, the constraint will use the
   * element's current width as the target width value.
   *
   * @param element - The UI element to apply the width constraint to
   * @param options - Configuration options for the constraint
   */
  constructor(
    private readonly element: UIPlaneElement & UILayerElement,
    options: Partial<UIWidthConstraintOptions> = {},
  ) {
    super(element.layer, options);

    if (options.width !== undefined) {
      assertValidPositiveNumber(
        options.width,
        "UIWidthConstraint.constructor.options.width",
      );
    }

    this.widthInternal = options.width ?? element.width;
    this.constraint = this.solverWrapper.createConstraint(
      new UIExpression(0, [[this.element.wVariable, 1]]),
      new UIExpression(this.widthInternal),
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  /**
   * Gets the current width value being enforced.
   * @returns The width value in pixels
   */
  public get width(): number {
    return this.widthInternal;
  }

  /**
   * Sets a new width value and updates the constraint equation.
   * @param value - The new width value in pixels
   */
  public set width(value: number) {
    assertValidPositiveNumber(value, "UIWidthConstraint.width");
    if (this.widthInternal !== value) {
      this.widthInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(value),
      );
    }
  }
}

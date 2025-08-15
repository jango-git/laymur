import type { UIElement } from "../elements/UIElement";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/**
 * Configuration options for UIHeightConstraint creation.
 */
export interface UIHeightConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The desired height value for the element. */
  height: number;
}

/**
 * Constraint that enforces a specific height value for UI elements.
 *
 * UIHeightConstraint creates a mathematical relationship that fixes an element's
 * height to a constant value. The constraint equation is: element.height = height.
 * This is useful for ensuring elements maintain a specific height regardless of
 * other layout changes or for setting fixed dimensions in responsive layouts.
 *
 * @see {@link UISingleParameterConstraint} - Base class for single-parameter constraints
 * @see {@link UIElement} - Elements that can have height constraints applied
 * @see {@link UIExpression} - Mathematical expressions for constraint equations
 */
export class UIHeightConstraint extends UISingleParameterConstraint {
  /** The constraint descriptor managed by the solver system. */
  protected override readonly constraint: number;

  /** Internal storage for the current height value. */
  private heightInternal: number;

  /**
   * Creates a new UIHeightConstraint instance.
   *
   * If no height is specified in options, the constraint will use the
   * element's current height as the target height value.
   *
   * @param element - The UI element to apply the height constraint to
   * @param options - Configuration options for the constraint
   */
  constructor(
    private readonly element: UIElement,
    options: Partial<UIHeightConstraintOptions> = {},
  ) {
    super(
      element.layer,
      options.priority,
      options.relation,
      options.orientation,
    );

    this.heightInternal = options.height ?? element.height;

    this.constraint = this.solverWrapper.createConstraint(
      new UIExpression(0, [[this.element.hVariable, 1]]),
      new UIExpression(this.heightInternal),
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  /**
   * Gets the current height value being enforced.
   * @returns The height value in pixels
   */
  public get height(): number {
    return this.heightInternal;
  }

  /**
   * Sets a new height value and updates the constraint equation.
   * @param value - The new height value in pixels
   */
  public set height(value: number) {
    if (this.heightInternal !== value) {
      this.heightInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(value),
      );
    }
  }
}

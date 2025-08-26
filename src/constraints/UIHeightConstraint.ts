import type { UILayerElement, UIPlaneElement } from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/**
 * Configuration options for UIHeightConstraint creation.
 *
 * @public
 */
export interface UIHeightConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The desired height value for the element. */
  height: number;
}

/**
 * Constraint that enforces a specific height value for UI elements.
 *
 * Creates the relationship: element.height = height. Useful for fixing
 * element heights regardless of other layout changes.
 *
 * @public
 */
export class UIHeightConstraint extends UISingleParameterConstraint {
  /** @internal */
  protected override readonly constraint: number;

  /** @internal */
  private heightInternal: number;

  /**
   * Creates a height constraint.
   *
   * Uses element's current height if no height is specified.
   *
   * @param element - UI element to constrain
   * @param options - Configuration options
   */
  constructor(
    private readonly element: UIPlaneElement & UILayerElement,
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
   * Gets the height value.
   *
   * @returns Height value in pixels
   */
  public get height(): number {
    return this.heightInternal;
  }

  /**
   * Sets the height value and updates the constraint.
   *
   * @param value - New height value in pixels
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

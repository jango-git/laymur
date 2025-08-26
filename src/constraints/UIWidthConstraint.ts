import type { UILayerElement, UIPlaneElement } from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/**
 * Configuration options for UIWidthConstraint creation.
 *
 * @public
 */
export interface UIWidthConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The desired width value for the element. */
  width: number;
}

/**
 * Constraint that enforces a specific width value for UI elements.
 *
 * Creates the relationship: element.width = width. Useful for fixing
 * element widths regardless of other layout changes.
 *
 * @public
 */
export class UIWidthConstraint extends UISingleParameterConstraint {
  /** @internal */
  protected override readonly constraint: number;

  /** @internal */
  private widthInternal: number;

  /**
   * Creates a width constraint.
   *
   * Uses element's current width if no width is specified.
   *
   * @param element - UI element to constrain
   * @param options - Configuration options
   */
  constructor(
    private readonly element: UIPlaneElement & UILayerElement,
    options: Partial<UIWidthConstraintOptions> = {},
  ) {
    super(
      element.layer,
      options.priority,
      options.relation,
      options.orientation,
    );

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
   * Gets the width value.
   *
   * @returns Width value in pixels
   */
  public get width(): number {
    return this.widthInternal;
  }

  /**
   * Sets the width value and updates the constraint.
   *
   * @param value - New width value in pixels
   */
  public set width(value: number) {
    if (this.widthInternal !== value) {
      this.widthInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(value),
      );
    }
  }
}

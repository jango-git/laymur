import type { UILayerElement, UIPlaneElement } from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/**
 * Configuration options for UIAspectConstraint creation.
 *
 * @public
 */
export interface UIAspectConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** The desired aspect ratio (width/height) for the element. */
  aspect: number;
}

/**
 * Constraint that maintains a specific aspect ratio for UI elements.
 *
 * Enforces the relationship: width = height * aspect. Useful for keeping
 * elements proportional during layout changes.
 *
 * @public
 */
export class UIAspectConstraint extends UISingleParameterConstraint {
  /** @internal */
  protected override readonly constraint: number;

  /** @internal */
  private aspectInternal: number;

  /**
   * Creates an aspect ratio constraint.
   *
   * Uses element's current width-to-height ratio if no aspect is specified.
   *
   * @param element - UI element to constrain
   * @param options - Configuration options
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
   * Gets the aspect ratio.
   *
   * @returns Aspect ratio (width/height)
   */
  public get aspect(): number {
    return this.aspectInternal;
  }

  /**
   * Sets the aspect ratio and updates the constraint.
   *
   * @param value - New aspect ratio (width/height)
   */
  public set aspect(value: number) {
    if (this.aspectInternal !== value) {
      this.aspectInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /**
   * Builds the constraint expression: width - (height * aspect) = 0
   *
   * @returns Constraint expression
   * @internal
   */
  private buildLHS(): UIExpression {
    return new UIExpression(0, [
      [this.element.wVariable, 1],
      [this.element.hVariable, -this.aspectInternal],
    ]);
  }
}

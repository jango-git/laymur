import type { UIPlaneElement, UIPointElement } from "../miscellaneous/asserts";
import {
  assertValidConstraintSubjects,
  assertValidNumber,
  isUIPlaneElement,
  isUIPointElement,
} from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";
import type { UIVerticalDistanceConstraintOptions } from "./UIVerticalDistanceConstraint.Internal";
import { DEFAULT_ANCHOR } from "./UIVerticalDistanceConstraint.Internal";

/**
 * Constraint that enforces vertical distance between two UI elements.
 *
 * UIVerticalDistanceConstraint creates a mathematical relationship that maintains
 * a specific vertical distance between two elements using configurable anchor points.
 * For plane elements, anchors determine the reference point (0.0 = top, 0.5 = center, 1.0 = bottom).
 * For point elements, the anchor is always the element's position. The constraint equation is:
 * (elementB.y + elementB.height * anchorB) - (elementA.y + elementA.height * anchorA) = distance
 *
 * @see {@link UISingleParameterConstraint} - Base class for single-parameter constraints
 * @see {@link UIPointElement} - Point elements that can be constrained
 * @see {@link UIPlaneElement} - Plane elements that can be constrained
 * @see {@link UIExpression} - Mathematical expressions for constraint equations
 */
export class UIVerticalDistanceConstraint extends UISingleParameterConstraint {
  /** The constraint descriptor managed by the solver system. */
  protected override readonly constraint: number;

  /** Internal storage for element A's anchor point. */
  private anchorAInternal: number;
  /** Internal storage for element B's anchor point. */
  private anchorBInternal: number;
  /** Internal storage for the vertical distance value. */
  private distanceInternal: number;

  /**
   * Creates a new UIVerticalDistanceConstraint instance.
   *
   * The constraint will use default anchor points (0.5 = center) and zero distance
   * if not specified in options. Both elements must be from the same layer.
   *
   * @param a - The first UI element (point or plane element)
   * @param b - The second UI element (point or plane element)
   * @param options - Configuration options for the constraint
   * @throws Will throw an error if elements are not from the same layer
   * @see {@link assertValidConstraintSubjects}
   */
  constructor(
    private readonly a: UIPointElement | UIPlaneElement,
    private readonly b: UIPointElement | UIPlaneElement,
    options: Partial<UIVerticalDistanceConstraintOptions> = {},
  ) {
    super(
      assertValidConstraintSubjects(a, b, "UIVerticalDistanceConstraint"),
      options,
    );

    if (options.anchorA !== undefined) {
      assertValidNumber(
        options.anchorA,
        "UIVerticalDistanceConstraint.constructor.anchorA",
      );
    }
    if (options.anchorB !== undefined) {
      assertValidNumber(
        options.anchorB,
        "UIVerticalDistanceConstraint.constructor.anchorB",
      );
    }
    if (options.distance !== undefined) {
      assertValidNumber(
        options.distance,
        "UIVerticalDistanceConstraint.constructor.distance",
      );
    }

    this.anchorAInternal = options.anchorA ?? DEFAULT_ANCHOR;
    this.anchorBInternal = options.anchorB ?? DEFAULT_ANCHOR;
    this.distanceInternal = options.distance ?? 0;

    this.constraint = this.solverWrapper.createConstraint(
      this.buildLHS(),
      new UIExpression(this.distanceInternal),
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  /**
   * Gets the current vertical distance being enforced.
   * @returns The vertical distance in pixels
   */
  public get distance(): number {
    return this.distanceInternal;
  }

  /**
   * Gets the anchor point for element A.
   * @returns The anchor value (0.0 = top, 0.5 = center, 1.0 = bottom)
   */
  public get anchorA(): number {
    return this.anchorAInternal;
  }

  /**
   * Gets the anchor point for element B.
   * @returns The anchor value (0.0 = top, 0.5 = center, 1.0 = bottom)
   */
  public get anchorB(): number {
    return this.anchorBInternal;
  }

  /**
   * Sets a new vertical distance and updates the constraint equation.
   * @param value - The new vertical distance in pixels
   */
  public set distance(value: number) {
    assertValidNumber(value, "UIVerticalDistanceConstraint.distance");
    if (this.distanceInternal !== value) {
      this.distanceInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(this.distanceInternal),
      );
    }
  }

  /**
   * Sets a new anchor point for element A and updates the constraint equation.
   * @param value - The new anchor value (0.0 = top, 0.5 = center, 1.0 = bottom)
   */
  public set anchorA(value: number) {
    assertValidNumber(value, "UIVerticalDistanceConstraint.anchorA");
    if (this.anchorAInternal !== value) {
      this.anchorAInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /**
   * Sets a new anchor point for element B and updates the constraint equation.
   * @param value - The new anchor value (0.0 = top, 0.5 = center, 1.0 = bottom)
   */
  public set anchorB(value: number) {
    assertValidNumber(value, "UIVerticalDistanceConstraint.anchorB");
    if (this.anchorBInternal !== value) {
      this.anchorBInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /**
   * Builds the left-hand side expression for the constraint equation.
   *
   * Creates the expression: (elementB.y + elementB.height * anchorB) - (elementA.y + elementA.height * anchorA)
   * For point elements, only the y position is used since they have no height.
   * For plane elements, the anchor determines the reference point within the element's height.
   *
   * @returns The UIExpression representing the vertical distance calculation
   */
  private buildLHS(): UIExpression {
    let aExpression: UIExpression;
    let bExpression: UIExpression;

    if (isUIPlaneElement(this.a)) {
      aExpression = new UIExpression(0, [
        [this.a.yVariable, 1],
        [this.a.hVariable, this.anchorAInternal],
      ]);
    } else if (isUIPointElement(this.a)) {
      aExpression = new UIExpression().plus(this.a.yVariable, 1);
    } else {
      throw new Error("A is not a valid element type");
    }

    if (isUIPlaneElement(this.b)) {
      bExpression = new UIExpression(0, [
        [this.b.yVariable, 1],
        [this.b.hVariable, this.anchorBInternal],
      ]);
    } else if (isUIPointElement(this.b)) {
      bExpression = new UIExpression().plus(this.b.yVariable, 1);
    } else {
      throw new Error("B is not a valid element type");
    }

    return UIExpression.minus(bExpression, aExpression);
  }
}

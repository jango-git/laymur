import type { UIPlaneElement, UIPointElement } from "../miscellaneous/asserts";
import {
  assertValidConstraintSubjects,
  isUIPlaneElement,
  isUIPointElement,
} from "../miscellaneous/asserts";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/** Default anchor point (0.5 = center) for elements when not specified. */
const DEFAULT_ANCHOR = 0.5;

/**
 * Configuration options for UIVerticalDistanceConstraint creation.
 *
 * @public
 */
export interface UIVerticalDistanceConstraintOptions
  extends UISingleParameterConstraintOptions {
  /** Anchor point for element A (0.0 = bottom edge, 0.5 = center, 1.0 = top edge). */
  anchorA: number;
  /** Anchor point for element B (0.0 = bottom edge, 0.5 = center, 1.0 = top edge). */
  anchorB: number;
  /** The desired vertical distance between the elements. */
  distance: number;
}

/**
 * Constraint that enforces vertical distance between two UI elements.
 *
 * Maintains distance between elements using configurable anchor points.
 * For plane elements, anchors determine the reference point (0.0 = bottom, 0.5 = center, 1.0 = top).
 * For point elements, the anchor is always the element's position.
 *
 * @public
 */
export class UIVerticalDistanceConstraint extends UISingleParameterConstraint {
  /** @internal */
  protected override readonly constraint: number;

  /** @internal */
  private anchorAInternal: number;
  /** @internal */
  private anchorBInternal: number;
  /** @internal */
  private distanceInternal: number;

  /**
   * Creates a vertical distance constraint.
   *
   * Uses default anchor points (0.5 = center) and zero distance if not specified.
   * Both elements must be from the same layer.
   *
   * @param a - First UI element
   * @param b - Second UI element
   * @param options - Configuration options
   * @throws Error when elements are not from the same layer
   */
  constructor(
    private readonly a: UIPointElement | UIPlaneElement,
    private readonly b: UIPointElement | UIPlaneElement,
    options: Partial<UIVerticalDistanceConstraintOptions> = {},
  ) {
    super(
      assertValidConstraintSubjects(a, b, "UIVerticalDistanceConstraint"),
      options.priority,
      options.relation,
      options.orientation,
    );

    this.anchorAInternal = options.anchorA ?? DEFAULT_ANCHOR;
    this.anchorBInternal = options.anchorB ?? DEFAULT_ANCHOR;
    this.distanceInternal = options.distance ?? 0;

    this.constraint = this.solverWrapper.createConstraint(
      this.buildLHS(),
      new UIExpression(this.distanceInternal),
      this.relationInternal,
      this.priorityInternal,
      this.isConstraintEnabled(),
    );
  }

  /**
   * Gets the vertical distance.
   *
   * @returns Vertical distance in pixels
   */
  public get distance(): number {
    return this.distanceInternal;
  }

  /**
   * Gets the anchor point for element A.
   *
   * @returns Anchor value (0.0 = bottom, 0.5 = center, 1.0 = top)
   */
  public get anchorA(): number {
    return this.anchorAInternal;
  }

  /**
   * Gets the anchor point for element B.
   *
   * @returns Anchor value (0.0 = bottom, 0.5 = center, 1.0 = top)
   */
  public get anchorB(): number {
    return this.anchorBInternal;
  }

  /**
   * Sets the vertical distance and updates the constraint.
   *
   * @param value - New vertical distance in pixels
   */
  public set distance(value: number) {
    if (this.distanceInternal !== value) {
      this.distanceInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(this.distanceInternal),
      );
    }
  }

  /**
   * Sets the anchor point for element A and updates the constraint.
   *
   * @param value - New anchor value (0.0 = bottom, 0.5 = center, 1.0 = top)
   */
  public set anchorA(value: number) {
    if (this.anchorAInternal !== value) {
      this.anchorAInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /**
   * Sets the anchor point for element B and updates the constraint.
   *
   * @param value - New anchor value (0.0 = bottom, 0.5 = center, 1.0 = top)
   */
  public set anchorB(value: number) {
    if (this.anchorBInternal !== value) {
      this.anchorBInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /**
   * Builds the constraint expression for vertical distance calculation.
   *
   * @returns Constraint expression
   * @internal
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

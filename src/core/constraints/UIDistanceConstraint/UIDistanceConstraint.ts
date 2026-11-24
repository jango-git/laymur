import { assertNotDestroyed, assertValidNumber } from "../../miscellaneous/asserts.js";
import type { UIPlaneElement, UIPointElement } from "../../miscellaneous/shared.js";
import { UIExpression } from "../../miscellaneous/UIExpression.js";
import { buildAnchorExpression, DEFAULT_ANCHOR } from "../constraintAnchors.js";
import { assertValidConstraintArguments } from "../constraintAsserts.js";
import { UISingleParameterConstraint } from "../UISingleParameterConstraint/UISingleParameterConstraint.js";
import type { UIDistanceConstraintOptions } from "./UIDistanceConstraint.Internal.js";
import { assertValidDistanceConstraintOptions } from "./UIDistanceConstraint.Internal.js";

/** Maintains distance between elements along one axis with configurable anchors */
export abstract class UIDistanceConstraint extends UISingleParameterConstraint {
  /** Solver constraint descriptor */
  protected override readonly constraint: number;

  private anchorAInternal: number;
  private anchorBInternal: number;
  private distanceInternal: number;

  /**
   * @param a First element
   * @param b Second element
   * @param options Distance configuration
   * @param vertical True to measure along the vertical axis
   */
  constructor(
    public readonly a: UIPointElement | UIPlaneElement,
    public readonly b: UIPointElement | UIPlaneElement,
    options: Partial<UIDistanceConstraintOptions>,
    private readonly vertical: boolean,
  ) {
    assertValidDistanceConstraintOptions(options);

    super(assertValidConstraintArguments(a, b, "UIDistanceConstraint.constructor"), options);

    this.anchorAInternal = options.anchorA ?? DEFAULT_ANCHOR;
    this.anchorBInternal = options.anchorB ?? DEFAULT_ANCHOR;
    this.distanceInternal = options.distance ?? 0;

    this.constraint = this.solverWrapper.createConstraint(
      this.buildLHS(),
      new UIExpression(this.distanceInternal),
      this.relation,
      this.priority,
      this.enabled,
      this,
    );
  }

  /** Current distance in world units */
  public get distance(): number {
    return this.distanceInternal;
  }

  /** Anchor on element A (0 = left or bottom, 0.5 = center, 1 = right or top) */
  public get anchorA(): number {
    return this.anchorAInternal;
  }

  /** Anchor on element B (0 = left or bottom, 0.5 = center, 1 = right or top) */
  public get anchorB(): number {
    return this.anchorBInternal;
  }

  /** Updates distance */
  public set distance(value: number) {
    assertNotDestroyed(this, "constraint", "UIDistanceConstraint.distance");
    assertValidNumber(value, "UIDistanceConstraint.distance");
    if (this.distanceInternal !== value) {
      this.distanceInternal = value;
      this.solverWrapper.setConstraintRHS(this.constraint, new UIExpression(this.distanceInternal));
    }
  }

  /** Updates anchor on element A */
  public set anchorA(value: number) {
    assertNotDestroyed(this, "constraint", "UIDistanceConstraint.anchorA");
    assertValidNumber(value, "UIDistanceConstraint.anchorA");
    if (this.anchorAInternal !== value) {
      this.anchorAInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Updates anchor on element B */
  public set anchorB(value: number) {
    assertNotDestroyed(this, "constraint", "UIDistanceConstraint.anchorB");
    assertValidNumber(value, "UIDistanceConstraint.anchorB");
    if (this.anchorBInternal !== value) {
      this.anchorBInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Builds constraint expression for distance between anchored positions */
  private buildLHS(): UIExpression {
    return UIExpression.minus(
      buildAnchorExpression(this.b, this.anchorBInternal, this.vertical),
      buildAnchorExpression(this.a, this.anchorAInternal, this.vertical),
    );
  }
}

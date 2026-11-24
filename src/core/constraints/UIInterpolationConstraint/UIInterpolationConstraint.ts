import { assertNotDestroyed, assertValidNumber } from "../../miscellaneous/asserts.js";
import type { UIPlaneElement, UIPointElement } from "../../miscellaneous/shared.js";
import { UIExpression } from "../../miscellaneous/UIExpression.js";
import { buildAnchorExpression, DEFAULT_ANCHOR } from "../constraintAnchors.js";
import { assertValidInterpolationConstraintArguments } from "../constraintAsserts.js";
import { UISingleParameterConstraint } from "../UISingleParameterConstraint/UISingleParameterConstraint.js";
import type { UIInterpolationConstraintOptions } from "./UIInterpolationConstraint.Internal.js";
import {
  assertValidInterpolationConstraintOptions,
  DEFAULT_T,
} from "./UIInterpolationConstraint.Internal.js";

/** Positions element C between A and B along one axis based on interpolation factor */
export abstract class UIInterpolationConstraint extends UISingleParameterConstraint {
  /** Solver constraint descriptor */
  protected override readonly constraint: number;

  private anchorAInternal: number;
  private anchorBInternal: number;
  private anchorCInternal: number;
  private tInternal: number;

  /**
   * @param a First element
   * @param b Second element
   * @param c Element to position between A and B
   * @param options Interpolation configuration
   * @param vertical True to interpolate along the vertical axis
   */
  constructor(
    public readonly a: UIPointElement | UIPlaneElement,
    public readonly b: UIPointElement | UIPlaneElement,
    public readonly c: UIPointElement | UIPlaneElement,
    options: Partial<UIInterpolationConstraintOptions>,
    private readonly vertical: boolean,
  ) {
    assertValidInterpolationConstraintOptions(options);

    const anchorA = options.anchorA ?? DEFAULT_ANCHOR;
    const anchorB = options.anchorB ?? DEFAULT_ANCHOR;

    super(
      assertValidInterpolationConstraintArguments(
        "UIInterpolationConstraint.constructor",
        a,
        b,
        c,
        anchorA,
        anchorB,
      ),
      options,
    );

    this.anchorAInternal = anchorA;
    this.anchorBInternal = anchorB;
    this.anchorCInternal = options.anchorC ?? DEFAULT_ANCHOR;
    this.tInternal = options.t ?? DEFAULT_T;

    this.constraint = this.solverWrapper.createConstraint(
      this.buildLHS(),
      new UIExpression(0),
      this.relation,
      this.priority,
      this.enabled,
      this,
    );
  }

  /** Interpolation factor (0 = A position, 1 = B position) */
  public get t(): number {
    return this.tInternal;
  }

  /** Anchor on element A (0 = left or bottom, 0.5 = center, 1 = right or top) */
  public get anchorA(): number {
    return this.anchorAInternal;
  }

  /** Anchor on element B (0 = left or bottom, 0.5 = center, 1 = right or top) */
  public get anchorB(): number {
    return this.anchorBInternal;
  }

  /** Anchor on element C (0 = left or bottom, 0.5 = center, 1 = right or top) */
  public get anchorC(): number {
    return this.anchorCInternal;
  }

  /** Updates interpolation factor */
  public set t(value: number) {
    assertNotDestroyed(this, "constraint", "UIInterpolationConstraint.t");
    assertValidNumber(value, "UIInterpolationConstraint.t");
    if (this.tInternal !== value) {
      this.tInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Updates anchor on element A */
  public set anchorA(value: number) {
    assertNotDestroyed(this, "constraint", "UIInterpolationConstraint.anchorA");
    assertValidNumber(value, "UIInterpolationConstraint.anchorA");
    if (this.anchorAInternal !== value) {
      this.anchorAInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Updates anchor on element B */
  public set anchorB(value: number) {
    assertNotDestroyed(this, "constraint", "UIInterpolationConstraint.anchorB");
    assertValidNumber(value, "UIInterpolationConstraint.anchorB");
    if (this.anchorBInternal !== value) {
      this.anchorBInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Updates anchor on element C */
  public set anchorC(value: number) {
    assertNotDestroyed(this, "constraint", "UIInterpolationConstraint.anchorC");
    assertValidNumber(value, "UIInterpolationConstraint.anchorC");
    if (this.anchorCInternal !== value) {
      this.anchorCInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Builds constraint expression: C - A*(1-t) - B*t = 0 */
  private buildLHS(): UIExpression {
    const aScaled = buildAnchorExpression(this.a, this.anchorAInternal, this.vertical).multiply(
      1 - this.tInternal,
    );
    const bScaled = buildAnchorExpression(this.b, this.anchorBInternal, this.vertical).multiply(
      this.tInternal,
    );
    const cExpression = buildAnchorExpression(this.c, this.anchorCInternal, this.vertical);
    return UIExpression.minus(UIExpression.minus(cExpression, aScaled), bScaled);
  }
}

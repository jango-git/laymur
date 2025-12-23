import {
  assertValidInterpolationConstraintArguments,
  assertValidNumber,
} from "../../miscellaneous/asserts";
import type {
  UIPlaneElement,
  UIPointElement,
} from "../../miscellaneous/shared";
import { isUIPlaneElement, isUIPointElement } from "../../miscellaneous/shared";
import { UIExpression } from "../../miscellaneous/UIExpression";
import { UISingleParameterConstraint } from "../UISingleParameterConstraint/UISingleParameterConstraint";
import type { UIHorizontalInterpolationConstraintOptions } from "./UIHorizontalInterpolationConstraint.Internal";
import {
  DEFAULT_ANCHOR,
  DEFAULT_T,
} from "./UIHorizontalInterpolationConstraint.Internal";

/** Positions element C horizontally between A and B based on interpolation factor */
export class UIHorizontalInterpolationConstraint extends UISingleParameterConstraint {
  /** Solver constraint descriptor */
  protected override readonly constraint: number;

  /** Anchor on element A */
  private anchorAInternal: number;
  /** Anchor on element B */
  private anchorBInternal: number;
  /** Anchor on element C */
  private anchorCInternal: number;
  /** Interpolation factor */
  private tInternal: number;

  /**
   * @param a First element
   * @param b Second element
   * @param c Element to position between A and B
   * @param options Interpolation configuration
   */
  constructor(
    private readonly a: UIPointElement | UIPlaneElement,
    private readonly b: UIPointElement | UIPlaneElement,
    private readonly c: UIPointElement | UIPlaneElement,
    options: Partial<UIHorizontalInterpolationConstraintOptions> = {},
  ) {
    if (options.anchorA !== undefined) {
      assertValidNumber(
        options.anchorA,
        "UIHorizontalInterpolationConstraint.constructor.options.anchorA",
      );
    }
    if (options.anchorB !== undefined) {
      assertValidNumber(
        options.anchorB,
        "UIHorizontalInterpolationConstraint.constructor.options.anchorB",
      );
    }
    if (options.anchorC !== undefined) {
      assertValidNumber(
        options.anchorC,
        "UIHorizontalInterpolationConstraint.constructor.options.anchorC",
      );
    }
    if (options.t !== undefined) {
      assertValidNumber(
        options.t,
        "UIHorizontalInterpolationConstraint.constructor.options.t",
      );
    }

    const anchorA = options.anchorA ?? DEFAULT_ANCHOR;
    const anchorB = options.anchorB ?? DEFAULT_ANCHOR;

    super(
      assertValidInterpolationConstraintArguments(
        "UIHorizontalInterpolationConstraint.constructor",
        a,
        b,
        c,
        anchorA,
        anchorB,
      ),
      options,
    );

    this.anchorAInternal = anchorA;
    this.anchorBInternal = anchorA;
    this.anchorCInternal = options.anchorC ?? DEFAULT_ANCHOR;
    this.tInternal = options.t ?? DEFAULT_T;

    this.constraint = this.solverWrapper.createConstraint(
      this.buildLHS(),
      new UIExpression(0),
      this.relation,
      this.priority,
      this.isConstraintEnabled(),
    );
  }

  /** Interpolation factor (0 = A position, 1 = B position) */
  public get t(): number {
    return this.tInternal;
  }

  /** Anchor on element A (0 = left, 0.5 = center, 1 = right) */
  public get anchorA(): number {
    return this.anchorAInternal;
  }

  /** Anchor on element B (0 = left, 0.5 = center, 1 = right) */
  public get anchorB(): number {
    return this.anchorBInternal;
  }

  /** Anchor on element C (0 = left, 0.5 = center, 1 = right) */
  public get anchorC(): number {
    return this.anchorCInternal;
  }

  /** Updates interpolation factor */
  public set t(value: number) {
    assertValidNumber(value, "UIHorizontalInterpolationConstraint.t");
    if (this.tInternal !== value) {
      this.tInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Updates anchor on element A */
  public set anchorA(value: number) {
    assertValidNumber(value, "UIHorizontalInterpolationConstraint.anchorA");
    if (this.anchorAInternal !== value) {
      this.anchorAInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Updates anchor on element B */
  public set anchorB(value: number) {
    assertValidNumber(value, "UIHorizontalInterpolationConstraint.anchorB");
    if (this.anchorBInternal !== value) {
      this.anchorBInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Updates anchor on element C */
  public set anchorC(value: number) {
    assertValidNumber(value, "UIHorizontalInterpolationConstraint.anchorC");
    if (this.anchorCInternal !== value) {
      this.anchorCInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Builds constraint expression: C - A*(1-t) - B*t = 0 */
  private buildLHS(): UIExpression {
    let aExpression: UIExpression;
    let bExpression: UIExpression;
    let cExpression: UIExpression;

    if (isUIPlaneElement(this.a)) {
      aExpression = new UIExpression(0, [
        [this.a.xVariable, 1],
        [this.a.wVariable, this.anchorAInternal],
      ]);
    } else if (isUIPointElement(this.a)) {
      aExpression = new UIExpression().plus(this.a.xVariable, 1);
    } else {
      throw new Error(
        "UIHorizontalInterpolationConstraint.buildLHS.a: invalid element type",
      );
    }

    if (isUIPlaneElement(this.b)) {
      bExpression = new UIExpression(0, [
        [this.b.xVariable, 1],
        [this.b.wVariable, this.anchorBInternal],
      ]);
    } else if (isUIPointElement(this.b)) {
      bExpression = new UIExpression().plus(this.b.xVariable, 1);
    } else {
      throw new Error(
        "UIHorizontalInterpolationConstraint.buildLHS.b: invalid element type",
      );
    }

    if (isUIPlaneElement(this.c)) {
      cExpression = new UIExpression(0, [
        [this.c.xVariable, 1],
        [this.c.wVariable, this.anchorCInternal],
      ]);
    } else if (isUIPointElement(this.c)) {
      cExpression = new UIExpression().plus(this.c.xVariable, 1);
    } else {
      throw new Error(
        "UIHorizontalInterpolationConstraint.buildLHS.c: invalid element type",
      );
    }

    // C - A*(1-t) - B*t = 0
    const aScaled = aExpression.clone().multiply(1 - this.tInternal);
    const bScaled = bExpression.clone().multiply(this.tInternal);
    return UIExpression.minus(
      UIExpression.minus(cExpression, aScaled),
      bScaled,
    );
  }
}

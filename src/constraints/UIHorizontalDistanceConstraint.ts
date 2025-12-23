import {
  assertValidConstraintArguments,
  assertValidNumber,
} from "../miscellaneous/asserts";
import type { UIPlaneElement, UIPointElement } from "../miscellaneous/shared";
import { isUIPlaneElement, isUIPointElement } from "../miscellaneous/shared";
import { UIExpression } from "../miscellaneous/UIExpression";
import type { UIHorizontalDistanceConstraintOptions } from "./UIHorizontalDistanceConstraint.Internal";
import { DEFAULT_ANCHOR } from "./UIHorizontalDistanceConstraint.Internal";
import { UISingleParameterConstraint } from "./UISingleParameterConstraint";

/** Maintains horizontal distance between elements with configurable anchors */
export class UIHorizontalDistanceConstraint extends UISingleParameterConstraint {
  /** Solver constraint descriptor */
  protected override readonly constraint: number;

  /** Anchor on element A */
  private anchorAInternal: number;
  /** Anchor on element B */
  private anchorBInternal: number;
  /** Current distance */
  private distanceInternal: number;

  /**
   * @param a First element
   * @param b Second element
   * @param options Distance configuration
   */
  constructor(
    private readonly a: UIPointElement | UIPlaneElement,
    private readonly b: UIPointElement | UIPlaneElement,
    options: Partial<UIHorizontalDistanceConstraintOptions> = {},
  ) {
    if (options.anchorA !== undefined) {
      assertValidNumber(
        options.anchorA,
        "UIHorizontalDistanceConstraint.constructor.options.anchorA",
      );
    }
    if (options.anchorB !== undefined) {
      assertValidNumber(
        options.anchorB,
        "UIHorizontalDistanceConstraint.constructor.options.anchorB",
      );
    }
    if (options.distance !== undefined) {
      assertValidNumber(
        options.distance,
        "UIHorizontalDistanceConstraint.constructor.options.distance",
      );
    }

    super(
      assertValidConstraintArguments(
        a,
        b,
        "UIHorizontalDistanceConstraint.constructor",
      ),
      options,
    );

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

  /** Current distance in world units */
  public get distance(): number {
    return this.distanceInternal;
  }

  /** Anchor on element A (0 = left, 0.5 = center, 1 = right) */
  public get anchorA(): number {
    return this.anchorAInternal;
  }

  /** Anchor on element B (0 = left, 0.5 = center, 1 = right) */
  public get anchorB(): number {
    return this.anchorBInternal;
  }

  /** Updates distance */
  public set distance(value: number) {
    assertValidNumber(value, "UIHorizontalDistanceConstraint.distance");
    if (this.distanceInternal !== value) {
      this.distanceInternal = value;
      this.solverWrapper.setConstraintRHS(
        this.constraint,
        new UIExpression(this.distanceInternal),
      );
    }
  }

  /** Updates anchor on element A */
  public set anchorA(value: number) {
    assertValidNumber(value, "UIHorizontalDistanceConstraint.anchorA");
    if (this.anchorAInternal !== value) {
      this.anchorAInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Updates anchor on element B */
  public set anchorB(value: number) {
    assertValidNumber(value, "UIHorizontalDistanceConstraint.anchorB");
    if (this.anchorBInternal !== value) {
      this.anchorBInternal = value;
      this.solverWrapper.setConstraintLHS(this.constraint, this.buildLHS());
    }
  }

  /** Builds constraint expression for distance between anchored positions */
  private buildLHS(): UIExpression {
    let aExpression: UIExpression;
    let bExpression: UIExpression;

    if (isUIPlaneElement(this.a)) {
      aExpression = new UIExpression(0, [
        [this.a.xVariable, 1],
        [this.a.wVariable, this.anchorAInternal],
      ]);
    } else if (isUIPointElement(this.a)) {
      aExpression = new UIExpression().plus(this.a.xVariable, 1);
    } else {
      throw new Error(
        "UIHorizontalDistanceConstraint.buildLHS.a: invalid element type",
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
        "UIHorizontalDistanceConstraint.buildLHS.b: invalid element type",
      );
    }

    return UIExpression.minus(bExpression, aExpression);
  }
}

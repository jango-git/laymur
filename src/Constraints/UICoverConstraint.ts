import { Constraint, Expression, Operator, Strength } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import type { UILayer } from "../Layers/UILayer";
import { assertSameLayer } from "../Miscellaneous/asserts";
import {
  addConstraintSymbol,
  disableConstraintSymbol,
  enableConstraintSymbol,
  heightSymbol,
  removeConstraintSymbol,
  widthSymbol,
  xSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import {
  resolveOrientation,
  UIOrientation,
} from "../Miscellaneous/UIOrientation";
import { UIConstraint } from "./UIConstraint";

/**
 * Default anchor value (0.5 = center) for cover constraint alignment
 */

const DEFAULT_ANCHOR = 0.5;

/**
 * Configuration options for cover constraints.
 */
export interface UICoverOptions {
  /** Whether to force equal height (true) or allow stretching (false) */
  isStrict: boolean;
  /** Horizontal anchor point (0-1) for alignment between elements */
  horizontalAnchor: number;
  /** Vertical anchor point (0-1) for alignment between elements */
  verticalAnchor: number;
  /** Screen orientation when this constraint should be active */
  orientation: UIOrientation;
}

/**
 * Constraint that makes an element cover another element or layer.
 *
 * The covering element will:
 * - Be aligned with the covered element using the specified anchors
 * - Have at least the same width and height as the covered element
 * - Optionally maintain strict proportions
 *
 * This is similar to CSS's "cover" object-fit behavior.
 */
export class UICoverConstraint extends UIConstraint {
  /** The configuration options for this constraint */
  private readonly parameters: UICoverOptions;

  /** Constraint for X-axis alignment */
  private constraintX?: Constraint;
  /** Constraint for Y-axis alignment */
  private constraintY?: Constraint;
  /** Constraint for width relationship */
  private constraintW?: Constraint;
  /** Constraint for height relationship */
  private constraintH?: Constraint;
  /** Optional constraint for maintaining strict proportions */
  private constraintStrict?: Constraint;

  /**
   * Creates a new cover constraint.
   *
   * @param elementOne - The element or layer to be covered (the reference)
   * @param elementTwo - The element that will cover the reference
   * @param parameters - Configuration options
   */
  constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UICoverOptions>,
  ) {
    assertSameLayer(elementOne, elementTwo);
    super(
      elementTwo.layer,
      new Set(
        elementOne instanceof UIElement
          ? [elementOne, elementTwo]
          : [elementTwo],
      ),
    );

    this.parameters = {
      isStrict: parameters?.isStrict ?? true,
      horizontalAnchor: parameters?.horizontalAnchor ?? DEFAULT_ANCHOR,
      verticalAnchor: parameters?.verticalAnchor ?? DEFAULT_ANCHOR,
      orientation: resolveOrientation(parameters?.orientation),
    };

    if (
      this.parameters.orientation === UIOrientation.ALWAYS ||
      this.parameters.orientation === this.layer.orientation
    ) {
      this.buildConstraints();
    }
  }

  /**
   * Destroys this constraint, removing it from the constraint system.
   */
  public override destroy(): void {
    this.destroyConstraints();
    super.destroy();
  }

  /**
   * Internal method to disable this constraint when orientation changes.
   *
   * @param orientation - The new screen orientation
   * @internal
   */
  public [disableConstraintSymbol](orientation: UIOrientation): void {
    if (
      this.parameters.orientation !== UIOrientation.ALWAYS &&
      orientation !== this.parameters.orientation
    ) {
      this.destroyConstraints();
    }
  }

  /**
   * Internal method to enable this constraint when orientation changes.
   *
   * @param orientation - The new screen orientation
   * @internal
   */
  public [enableConstraintSymbol](orientation: UIOrientation): void {
    if (
      this.parameters.orientation !== UIOrientation.ALWAYS &&
      orientation === this.parameters.orientation
    ) {
      this.buildConstraints();
    }
  }

  /**
   * Builds and adds the cover constraints to the constraint solver.
   *
   * Creates five constraints:
   * 1. X alignment between the elements
   * 2. Y alignment between the elements
   * 3. Width covering (elementTwo width ≥ elementOne width)
   * 4. Height covering (elementTwo height ≥ elementOne height)
   * 5. Optional strict proportions (if isStrict = false)
   *
   */
  protected buildConstraints(): void {
    this.constraintX = new Constraint(
      new Expression(this.elementOne[xSymbol]).plus(
        new Expression(this.elementOne[widthSymbol]).multiply(
          this.parameters.horizontalAnchor,
        ),
      ),
      Operator.Eq,
      new Expression(this.elementTwo[xSymbol]).plus(
        new Expression(this.elementTwo[widthSymbol]).multiply(
          this.parameters.horizontalAnchor,
        ),
      ),
    );

    this.constraintY = new Constraint(
      new Expression(this.elementOne[ySymbol]).plus(
        new Expression(this.elementOne[heightSymbol]).multiply(
          this.parameters.verticalAnchor,
        ),
      ),
      Operator.Eq,
      new Expression(this.elementTwo[ySymbol]).plus(
        new Expression(this.elementTwo[heightSymbol]).multiply(
          this.parameters.verticalAnchor,
        ),
      ),
    );

    this.constraintW = new Constraint(
      new Expression(this.elementOne[widthSymbol]),
      Operator.Le,
      new Expression(this.elementTwo[widthSymbol]),
    );

    this.constraintH = new Constraint(
      new Expression(this.elementOne[heightSymbol]),
      Operator.Le,
      new Expression(this.elementTwo[heightSymbol]),
    );

    this.layer[addConstraintSymbol](this, this.constraintX);
    this.layer[addConstraintSymbol](this, this.constraintY);

    this.layer[addConstraintSymbol](this, this.constraintW);
    this.layer[addConstraintSymbol](this, this.constraintH);

    if (!this.parameters.isStrict) {
      this.constraintStrict = new Constraint(
        new Expression(this.elementOne[heightSymbol]),
        Operator.Eq,
        new Expression(this.elementTwo[heightSymbol]),
        Strength.strong,
      );

      this.layer[addConstraintSymbol](this, this.constraintStrict);
    }
  }

  /**
   * Removes all cover constraints from the constraint solver.
   *
   */
  protected destroyConstraints(): void {
    if (this.constraintX) {
      this.layer[removeConstraintSymbol](this, this.constraintX);
      this.constraintX = undefined;
    }
    if (this.constraintY) {
      this.layer[removeConstraintSymbol](this, this.constraintY);
      this.constraintY = undefined;
    }
    if (this.constraintW) {
      this.layer[removeConstraintSymbol](this, this.constraintW);
      this.constraintW = undefined;
    }
    if (this.constraintH) {
      this.layer[removeConstraintSymbol](this, this.constraintH);
      this.constraintH = undefined;
    }
    if (this.constraintStrict) {
      this.layer[removeConstraintSymbol](this, this.constraintStrict);
      this.constraintStrict = undefined;
    }
  }
}

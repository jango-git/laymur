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
 * Default anchor value (0.5 = center) for fit constraint alignment
 */
const DEFAULT_ANCHOR = 0.5;

/**
 * Configuration options for fit constraints.
 */
export interface UIFitOptions {
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
 * Constraint that makes an element fit within another element or layer.
 *
 * The fitting element will:
 * - Be aligned with the container element using the specified anchors
 * - Have at most the same width and height as the container element
 * - Optionally maintain strict proportions
 *
 * This is similar to CSS's "contain" object-fit behavior.
 */
export class UIFitConstraint extends UIConstraint {
  /** The configuration options for this constraint */
  private readonly parameters: UIFitOptions;

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
   * Creates a new fit constraint.
   *
   * @param elementOne - The element or layer that contains the fitting element (the container)
   * @param elementTwo - The element that will fit within the container
   * @param parameters - Configuration options
   */
  constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UIFitOptions>,
  ) {
    super(
      elementTwo.layer,
      new Set(
        elementOne instanceof UIElement
          ? [elementOne, elementTwo]
          : [elementTwo],
      ),
    );
    assertSameLayer(elementOne, elementTwo);

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
   * Builds and adds the fit constraints to the constraint solver.
   *
   * Creates five constraints:
   * 1. X alignment between the elements
   * 2. Y alignment between the elements
   * 3. Width fitting (elementTwo width ≤ elementOne width)
   * 4. Height fitting (elementTwo height ≤ elementOne height)
   * 5. Optional strict proportions (if isStrict = true)
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
      Operator.Ge,
      new Expression(this.elementTwo[widthSymbol]),
    );

    this.constraintH = new Constraint(
      new Expression(this.elementOne[heightSymbol]),
      Operator.Ge,
      new Expression(this.elementTwo[heightSymbol]),
    );

    this.layer[addConstraintSymbol](this, this.constraintX);
    this.layer[addConstraintSymbol](this, this.constraintY);

    this.layer[addConstraintSymbol](this, this.constraintW);
    this.layer[addConstraintSymbol](this, this.constraintH);

    if (this.parameters.isStrict !== false) {
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
   * Removes all fit constraints from the constraint solver.
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

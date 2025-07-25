import { Constraint, Expression } from "kiwi.js";
import { UIAnchor } from "../Elements/UIAnchor";
import { UIElement } from "../Elements/UIElement";
import { UILayer } from "../Layers/UILayer";
import { assertSameLayer } from "../Miscellaneous/asserts";
import {
  addConstraintSymbol,
  disableConstraintSymbol,
  enableConstraintSymbol,
  heightSymbol,
  removeConstraintSymbol,
  ySymbol,
} from "../Miscellaneous/symbols";
import {
  resolveOrientation,
  UIOrientation,
} from "../Miscellaneous/UIOrientation";
import { UIConstraint } from "./UIConstraint";
import type { UIConstraintPower } from "./UIConstraintPower";
import { convertPowerToStrength, resolvePower } from "./UIConstraintPower";
import type { UIConstraintRule } from "./UIConstraintRule";
import { convertRuleToOperator, resolveRule } from "./UIConstraintRule";

/**
 * Default anchor value (0.5 = center) for vertical distance constraint
 */
const DEFAULT_ANCHOR = 0.5;

/**
 * Configuration options for vertical distance constraints.
 */
export interface UIVerticalDistanceOptions {
  /** Vertical anchor point (0-1) for the first element */
  anchorOne: number;
  /** Vertical anchor point (0-1) for the second element */
  anchorTwo: number;
  /** The target distance between the two elements' anchor points */
  distance: number;
  /** Priority level for this constraint */
  power: UIConstraintPower;
  /** Rule for the constraint relationship (equal, less than, greater than) */
  rule: UIConstraintRule;
  /** Screen orientation when this constraint should be active */
  orientation: UIOrientation;
}

/**
 * Constraint that enforces a specific vertical distance between two UI elements.
 *
 * This constraint measures the distance between two anchor points on the y-axis
 * and ensures it matches (or is less/greater than) the specified distance value.
 */
export class UIVerticalDistanceConstraint extends UIConstraint {
  /** The configuration options for this constraint */
  private readonly parameters: UIVerticalDistanceOptions;
  /** The Kiwi.js constraint object */
  private constraint?: Constraint;

  /**
   * Creates a new vertical distance constraint.
   *
   * @param elementOne - The first element or layer
   * @param elementTwo - The second element
   * @param parameters - Configuration options
   */
  constructor(
    private readonly elementOne: UIElement | UIAnchor | UILayer,
    private readonly elementTwo: UIElement | UIAnchor,
    parameters?: Partial<UIVerticalDistanceOptions>,
  ) {
    assertSameLayer(elementOne, elementTwo);
    super(
      elementTwo.layer,
      new Set(
        elementOne instanceof UIElement || elementOne instanceof UIAnchor
          ? [elementOne, elementTwo]
          : [elementTwo],
      ),
    );

    this.parameters = {
      anchorOne: parameters?.anchorOne ?? DEFAULT_ANCHOR,
      anchorTwo: parameters?.anchorTwo ?? DEFAULT_ANCHOR,
      distance: parameters?.distance ?? 0,
      power: resolvePower(parameters?.power),
      rule: resolveRule(parameters?.rule),
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
   * Builds and adds the vertical distance constraint to the constraint solver.
   *
   * Creates a constraint that enforces the distance between anchor points
   * on the y-axis of two elements based on the specified rule.
   *
   */
  protected buildConstraints(): void {
    const expressionOne =
      this.elementOne instanceof UIElement || this.elementOne instanceof UILayer
        ? new Expression(this.elementOne[ySymbol]).plus(
            new Expression(this.elementOne[heightSymbol]).multiply(
              this.parameters.anchorOne,
            ),
          )
        : new Expression(this.elementOne[ySymbol]);

    const expressionTwo =
      this.elementTwo instanceof UIElement
        ? new Expression(this.elementTwo[ySymbol]).plus(
            new Expression(this.elementTwo[heightSymbol]).multiply(
              this.parameters.anchorTwo,
            ),
          )
        : new Expression(this.elementTwo[ySymbol]);

    this.constraint = new Constraint(
      expressionTwo.minus(expressionOne),
      convertRuleToOperator(this.parameters.rule),
      this.parameters.distance,
      convertPowerToStrength(this.parameters.power),
    );

    this.layer[addConstraintSymbol](this, this.constraint);
  }

  /**
   * Removes the vertical distance constraint from the constraint solver.
   *
   */
  protected destroyConstraints(): void {
    if (this.constraint) {
      this.layer[removeConstraintSymbol](this, this.constraint);
      this.constraint = undefined;
    }
  }
}

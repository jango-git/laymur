import { Constraint, Expression } from "kiwi.js";
import { UIAnchor } from "../elements/UIAnchor";
import { UIElement } from "../elements/UIElement";
import { UILayer } from "../layers/UILayer";
import { assertSameLayer } from "../miscellaneous/asserts";

import {
  resolveOrientation,
  UIOrientation,
} from "../miscellaneous/UIOrientation";
import { UIConstraint } from "./UIConstraint";
import type { UIConstraintPower } from "./UIConstraintPower";
import { convertPowerToStrength, resolvePower } from "./UIConstraintPower";
import type { UIConstraintRule } from "./UIConstraintRule";
import { convertRuleToOperator, resolveRule } from "./UIConstraintRule";

/**
 * Default anchor value (0.5 = center) for horizontal distance constraint
 */
const DEFAULT_ANCHOR = 0.5;

/**
 * Configuration options for horizontal distance constraints.
 */
export interface UIHorizontalDistanceOptions {
  /** Horizontal anchor point (0-1) for the first element */
  anchorOne: number;
  /** Horizontal anchor point (0-1) for the second element */
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
 * Constraint that enforces a specific horizontal distance between two UI elements.
 *
 * This constraint measures the distance between two anchor points on the x-axis
 * and ensures it matches (or is less/greater than) the specified distance value.
 */
export class UIHorizontalDistanceConstraint extends UIConstraint {
  /** The configuration options for this constraint */
  private readonly options: UIHorizontalDistanceOptions;
  /** The Kiwi.js constraint object */
  private constraint?: Constraint;

  /**
   * Creates a new horizontal distance constraint.
   *
   * @param elementOne - The first element or layer
   * @param elementTwo - The second element
   * @param options - Configuration options
   */
  constructor(
    private readonly elementOne: UIElement | UIAnchor | UILayer,
    private readonly elementTwo: UIElement | UIAnchor,
    options: Partial<UIHorizontalDistanceOptions> = {},
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

    this.options = {
      anchorOne: options.anchorOne ?? DEFAULT_ANCHOR,
      anchorTwo: options.anchorTwo ?? DEFAULT_ANCHOR,
      distance: options.distance ?? 0,
      power: resolvePower(options.power),
      rule: resolveRule(options.rule),
      orientation: resolveOrientation(options.orientation),
    };

    if (
      this.options.orientation === UIOrientation.ALWAYS ||
      this.options.orientation === this.layer.orientation
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
  public ["disableConstraintInternal"](orientation: UIOrientation): void {
    if (
      this.options.orientation !== UIOrientation.ALWAYS &&
      orientation !== this.options.orientation
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
  public ["enableConstraintInternal"](orientation: UIOrientation): void {
    if (
      this.options.orientation !== UIOrientation.ALWAYS &&
      orientation === this.options.orientation
    ) {
      this.buildConstraints();
    }
  }

  /**
   * Builds and adds the horizontal distance constraint to the constraint solver.
   *
   * Creates a constraint that enforces the distance between anchor points
   * on the x-axis of two elements based on the specified rule.
   *
   */
  protected buildConstraints(): void {
    const expressionOne =
      this.elementOne instanceof UIElement || this.elementOne instanceof UILayer
        ? new Expression(this.elementOne["xInternal"]).plus(
            new Expression(this.elementOne["widthInternal"]).multiply(
              this.options.anchorOne,
            ),
          )
        : new Expression(this.elementOne["xInternal"]);

    const expressionTwo =
      this.elementTwo instanceof UIElement
        ? new Expression(this.elementTwo["xInternal"]).plus(
            new Expression(this.elementTwo["widthInternal"]).multiply(
              this.options.anchorTwo,
            ),
          )
        : new Expression(this.elementTwo["xInternal"]);

    this.constraint = new Constraint(
      expressionTwo.minus(expressionOne),
      convertRuleToOperator(this.options.rule),
      this.options.distance,
      convertPowerToStrength(this.options.power),
    );

    this.layer["addConstraintInternal"](this, this.constraint);
  }

  /**
   * Removes the horizontal distance constraint from the constraint solver.
   *
   */
  protected destroyConstraints(): void {
    if (this.constraint) {
      this.layer["removeConstraintInternal"](this, this.constraint);
      this.constraint = undefined;
    }
  }
}

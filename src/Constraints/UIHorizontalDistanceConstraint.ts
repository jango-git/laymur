import { Constraint, Expression } from "kiwi.js";
import { UIElement } from "../Elements/UIElement";
import type { UILayer } from "../Layers/UILayer";
import { assertSameLayer } from "../Miscellaneous/asserts";
import {
  addConstraintSymbol,
  disableConstraintSymbol,
  enableConstraintSymbol,
  removeConstraintSymbol,
  widthSymbol,
  xSymbol,
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
  private readonly parameters: UIHorizontalDistanceOptions;
  /** The Kiwi.js constraint object */
  private constraint?: Constraint;

  /**
   * Creates a new horizontal distance constraint.
   *
   * @param elementOne - The first element or layer
   * @param elementTwo - The second element
   * @param parameters - Configuration options
   */
  constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UIHorizontalDistanceOptions>,
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
   * Builds and adds the horizontal distance constraint to the constraint solver.
   *
   * Creates a constraint that enforces the distance between anchor points
   * on the x-axis of two elements based on the specified rule.
   *
   */
  protected buildConstraints(): void {
    const expressionOne = new Expression(this.elementOne[xSymbol]).plus(
      new Expression(this.elementOne[widthSymbol]).multiply(
        this.parameters.anchorOne,
      ),
    );

    const expressionTwo = new Expression(this.elementTwo[xSymbol]).plus(
      new Expression(this.elementTwo[widthSymbol]).multiply(
        this.parameters.anchorTwo,
      ),
    );

    this.constraint = new Constraint(
      expressionTwo.minus(expressionOne),
      convertRuleToOperator(this.parameters.rule),
      this.parameters.distance,
      convertPowerToStrength(this.parameters.power),
    );

    this.layer[addConstraintSymbol](this, this.constraint);
  }

  /**
   * Removes the horizontal distance constraint from the constraint solver.
   *
   */
  protected destroyConstraints(): void {
    if (this.constraint) {
      this.layer[removeConstraintSymbol](this, this.constraint);
      this.constraint = undefined;
    }
  }
}

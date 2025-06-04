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
 * Configuration options for horizontal proportion constraints.
 */
export interface UIHorizontalProportionOptions {
  /** The proportion ratio between elements' widths */
  proportion: number;
  /** Priority level for this constraint */
  power: UIConstraintPower;
  /** Rule for the constraint relationship (equal, less than, greater than) */
  rule: UIConstraintRule;
  /** Screen orientation when this constraint should be active */
  orientation: UIOrientation;
}

/**
 * Constraint that enforces a proportional relationship between the widths of two elements.
 *
 * This constraint ensures that the width of one element is proportionally
 * related to the width of another element by a specified ratio.
 */
export class UIHorizontalProportionConstraint extends UIConstraint {
  /** The configuration options for this constraint */
  private readonly parameters: UIHorizontalProportionOptions;
  /** The Kiwi.js constraint object */
  private constraint?: Constraint;

  /**
   * Creates a new horizontal proportion constraint.
   *
   * @param elementOne - The reference element or layer
   * @param elementTwo - The element to constrain proportionally
   * @param parameters - Configuration options
   */
  constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    parameters?: Partial<UIHorizontalProportionOptions>,
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
      proportion: parameters?.proportion ?? 1,
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
   * Builds and adds the horizontal proportion constraint to the constraint solver.
   *
   * Creates a constraint expression in the form: (elementOne.width * proportion) - elementTwo.width = 0
   * This ensures the width ratio between elements matches the specified proportion.
   *
   */
  protected buildConstraints(): void {
    const expressionOne = new Expression(this.elementOne[widthSymbol]).multiply(
      this.parameters.proportion,
    );
    const expressionTwo = new Expression(this.elementTwo[widthSymbol]);

    this.constraint = new Constraint(
      expressionOne.minus(expressionTwo),
      convertRuleToOperator(this.parameters.rule),
      0,
      convertPowerToStrength(this.parameters.power),
    );

    this.layer[addConstraintSymbol](this, this.constraint);
  }

  /**
   * Removes the horizontal proportion constraint from the constraint solver.
   *
   */
  protected destroyConstraints(): void {
    if (this.constraint) {
      this.layer[removeConstraintSymbol](this, this.constraint);
      this.constraint = undefined;
    }
  }
}

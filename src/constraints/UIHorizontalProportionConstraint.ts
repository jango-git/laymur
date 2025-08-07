import { Constraint, Expression } from "kiwi.js";
import { UIElement } from "../elements/UIElement";
import type { UILayer } from "../layers/UILayer";
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
  private readonly options: UIHorizontalProportionOptions;
  /** The Kiwi.js constraint object */
  private constraint?: Constraint;

  /**
   * Creates a new horizontal proportion constraint.
   *
   * @param elementOne - The reference element or layer
   * @param elementTwo - The element to constrain proportionally
   * @param options - Configuration options
   */
  constructor(
    private readonly elementOne: UIElement | UILayer,
    private readonly elementTwo: UIElement,
    options: Partial<UIHorizontalProportionOptions> = {},
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

    this.options = {
      proportion: options.proportion ?? 1,
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
   * Builds and adds the horizontal proportion constraint to the constraint solver.
   *
   * Creates a constraint expression in the form: (elementOne.width * proportion) - elementTwo.width = 0
   * This ensures the width ratio between elements matches the specified proportion.
   *
   */
  protected buildConstraints(): void {
    const expressionOne = new Expression(
      this.elementOne["widthInternal"],
    ).multiply(this.options.proportion);
    const expressionTwo = new Expression(this.elementTwo["widthInternal"]);

    this.constraint = new Constraint(
      expressionOne.minus(expressionTwo),
      convertRuleToOperator(this.options.rule),
      0,
      convertPowerToStrength(this.options.power),
    );

    this.layer["addConstraintInternal"](this, this.constraint);
  }

  /**
   * Removes the horizontal proportion constraint from the constraint solver.
   *
   */
  protected destroyConstraints(): void {
    if (this.constraint) {
      this.layer["removeConstraintInternal"](this, this.constraint);
      this.constraint = undefined;
    }
  }
}

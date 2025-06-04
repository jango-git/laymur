import { Constraint, Expression } from "kiwi.js";
import type { UIElement } from "../Elements/UIElement";
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
 * Configuration options for width constraints.
 */
export interface UIWidthOptions {
  /** The fixed width value to constrain the element to */
  width: number;
  /** Priority level for this constraint */
  power: UIConstraintPower;
  /** Rule for the constraint relationship (equal, less than, greater than) */
  rule: UIConstraintRule;
  /** Screen orientation when this constraint should be active */
  orientation: UIOrientation;
}

/**
 * Constraint that enforces a specific width for a UI element.
 *
 * This constraint can be configured to require an exact width
 * or set minimum/maximum width limits using different rules.
 */
export class UIWidthConstraint extends UIConstraint {
  /** The configuration options for this constraint */
  private readonly options: UIWidthOptions;
  /** The Kiwi.js constraint object */
  private constraint?: Constraint;

  /**
   * Creates a new width constraint.
   *
   * @param element - The UI element to constrain
   * @param options - Configuration options
   */
  constructor(
    private readonly element: UIElement,
    options?: Partial<UIWidthOptions>,
  ) {
    super(element.layer, new Set([element]));

    this.options = {
      width: options?.width ?? element.width,
      power: resolvePower(options?.power),
      rule: resolveRule(options?.rule),
      orientation: resolveOrientation(options?.orientation),
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
  public [disableConstraintSymbol](orientation: UIOrientation): void {
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
  public [enableConstraintSymbol](orientation: UIOrientation): void {
    if (
      this.options.orientation !== UIOrientation.ALWAYS &&
      orientation === this.options.orientation
    ) {
      this.buildConstraints();
    }
  }

  /**
   * Builds and adds the width constraint to the constraint solver.
   *
   * Creates a constraint that enforces the element's width based
   * on the specified rule (equal to, less than, or greater than).
   *
   */
  protected buildConstraints(): void {
    this.constraint = new Constraint(
      new Expression(this.element[widthSymbol]),
      convertRuleToOperator(this.options.rule),
      this.options.width,
      convertPowerToStrength(this.options.power),
    );

    this.layer[addConstraintSymbol](this, this.constraint);
  }

  /**
   * Removes the width constraint from the constraint solver.
   *
   */
  protected destroyConstraints(): void {
    if (this.constraint) {
      this.layer[removeConstraintSymbol](this, this.constraint);
      this.constraint = undefined;
    }
  }
}

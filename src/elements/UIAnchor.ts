import { Eventail } from "eventail";
import type { UILayer } from "../layers/UILayer";
import type { UIPointElement } from "../miscellaneous/asserts";
import { assertValidNumber } from "../miscellaneous/asserts";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISolverWrapper } from "../wrappers/UISolverWrapper";

/**
 * Abstract base class representing a minimal UI element as a point in 2D space.
 *
 * A UIAnchor serves as the fundamental building block for UI layout systems,
 * representing a single point with x and y coordinates. It provides constraint-based
 * positioning through solver variables and serves as an anchor point for more
 * complex UI elements.
 *
 * @see {@link UIPointElement} - Interface defining point element behavior
 * @see {@link UILayer} - Container layer for UI elements
 * @see {@link UISolverWrapper} - Constraint solver integration
 */
export abstract class UIAnchor extends Eventail implements UIPointElement {
  /** Optional name identifier for the anchor. */
  public name = "";

  /**
   * Solver variable descriptor for the x-coordinate.
   * This variable is managed by the constraint solver system.
   */
  public readonly xVariable: number;

  /**
   * Solver variable descriptor for the y-coordinate.
   * This variable is managed by the constraint solver system.
   */
  public readonly yVariable: number;

  /**
   * Reference to the constraint solver wrapper for variable management.
   * @see {@link UISolverWrapper}
   */
  protected readonly solverWrapper: UISolverWrapper;

  /**
   * Creates a new UIAnchor instance.
   *
   * @param layer - The UI layer that contains this anchor
   * @param x - Initial x-coordinate position
   * @param y - Initial y-coordinate position
   * @throws Will throw an error if x or y are not valid numbers
   * @see {@link assertValidNumber}
   */
  constructor(
    public readonly layer: UILayer,
    x: number,
    y: number,
  ) {
    assertValidNumber(x, "UIAnchor x");
    assertValidNumber(y, "UIAnchor y");

    super();
    this.solverWrapper = this.layer["getSolverWrapperInternal"]();
    this.xVariable = this.solverWrapper.createVariable(x, UIPriority.P7);
    this.yVariable = this.solverWrapper.createVariable(y, UIPriority.P7);
  }

  /**
   * Gets the current x-coordinate value from the solver.
   * @returns The current x-coordinate position
   */
  public get x(): number {
    return this.solverWrapper.readVariableValue(this.xVariable);
  }

  /**
   * Gets the current y-coordinate value from the solver.
   * @returns The current y-coordinate position
   */
  public get y(): number {
    return this.solverWrapper.readVariableValue(this.yVariable);
  }

  /**
   * Sets the x-coordinate value through the solver system.
   * @param value - The new x-coordinate value
   * @throws Will throw an error if value is not a valid number
   * @see {@link assertValidNumber}
   */
  public set x(value: number) {
    assertValidNumber(value, "UIAnchor x");
    this.solverWrapper.suggestVariableValue(this.xVariable, value);
  }

  /**
   * Sets the y-coordinate value through the solver system.
   * @param value - The new y-coordinate value
   * @throws Will throw an error if value is not a valid number
   * @see {@link assertValidNumber}
   */
  public set y(value: number) {
    assertValidNumber(value, "UIAnchor y");
    this.solverWrapper.suggestVariableValue(this.yVariable, value);
  }

  /**
   * Destroys the anchor by removing its solver variables.
   *
   * This method cleans up the solver variables associated with this anchor,
   * effectively removing it from the constraint solving system. After calling
   * this method, the anchor should not be used anymore.
   */
  public destroy(): void {
    this.solverWrapper.removeVariable(this.yVariable);
    this.solverWrapper.removeVariable(this.xVariable);
  }
}

import { Eventail } from "eventail";
import type { UILayer } from "../layers/UILayer";
import type { UIPointElement } from "../miscellaneous/asserts";
import { assertValidNumber } from "../miscellaneous/asserts";
import { UIPriority } from "../miscellaneous/UIPriority";
import type { UISolverWrapper } from "../wrappers/UISolverWrapper";

/**
 * Base class representing a point in 2D space with constraint-based positioning.
 *
 * Represents a single point with x and y coordinates managed by the constraint solver.
 * Serves as a base for more complex UI elements.
 *
 * @public
 */
export abstract class UIAnchor extends Eventail implements UIPointElement {
  /** Optional name identifier for the anchor. */
  public name = "";

  /**
   * Solver variable for the x-coordinate.
   */
  public readonly xVariable: number;

  /**
   * Solver variable for the y-coordinate.
   */
  public readonly yVariable: number;

  /**
   * Reference to the constraint solver wrapper.
   */
  protected readonly solverWrapper: UISolverWrapper;

  /**
   * Creates a new UIAnchor instance.
   *
   * @param layer - The UI layer that contains this anchor
   * @param x - Initial x-coordinate position
   * @param y - Initial y-coordinate position
   *
   * @throws Error if x or y are not valid numbers
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
   *
   * @returns The current x-coordinate position
   */
  public get x(): number {
    return this.solverWrapper.readVariableValue(this.xVariable);
  }

  /**
   * Gets the current y-coordinate value from the solver.
   *
   * @returns The current y-coordinate position
   */
  public get y(): number {
    return this.solverWrapper.readVariableValue(this.yVariable);
  }

  /**
   * Sets the x-coordinate value through the solver system.
   *
   * @param value - The new x-coordinate value
   *
   * @throws Error if value is not a valid number
   */
  public set x(value: number) {
    assertValidNumber(value, "UIAnchor x");
    this.solverWrapper.suggestVariableValue(this.xVariable, value);
  }

  /**
   * Sets the y-coordinate value through the solver system.
   *
   * @param value - The new y-coordinate value
   *
   * @throws Error if value is not a valid number
   */
  public set y(value: number) {
    assertValidNumber(value, "UIAnchor y");
    this.solverWrapper.suggestVariableValue(this.yVariable, value);
  }

  /**
   * Destroys the anchor by removing its solver variables.
   * After calling this method, the anchor should not be used anymore.
   */
  public destroy(): void {
    this.solverWrapper.removeVariable(this.yVariable);
    this.solverWrapper.removeVariable(this.xVariable);
  }
}

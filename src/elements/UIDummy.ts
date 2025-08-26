import type { UILayer } from "../layers/UILayer";
import {
  assertValidPositiveNumber,
  type UIPlaneElement,
} from "../miscellaneous/asserts";
import { UIPriority } from "../miscellaneous/UIPriority";
import { UIAnchor } from "./UIAnchor";

/** Default width and height value for UIDummy elements. */
const DEFAULT_SIZE = 100;

export interface UIDummyOptions {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * UI element that extends UIAnchor with dimensions but without rendering.
 *
 * Represents a rectangular area with position and dimensions but performs no visual rendering.
 * Useful as a placeholder or spacer element in constraint-based layouts.
 *
 * @public
 */
export abstract class UIDummy extends UIAnchor implements UIPlaneElement {
  /**
   * Solver variable for the width dimension.
   */
  public readonly wVariable: number;

  /**
   * Solver variable for the height dimension.
   */
  public readonly hVariable: number;

  /**
   * Creates a new UIDummy instance with position and dimensions.
   *
   * @param layer - The UI layer that contains this dummy element
   * @param options - Configuration options (all optional, with defaults)
   *
   * @throws Error if width or height are not valid positive numbers
   */
  constructor(layer: UILayer, options: Partial<UIDummyOptions> = {}) {
    const x = options.x ?? 0;
    const y = options.y ?? 0;
    const w = options.width ?? DEFAULT_SIZE;
    const h = options.height ?? DEFAULT_SIZE;

    assertValidPositiveNumber(w, "UIDummy width");
    assertValidPositiveNumber(h, "UIDummy height");

    super(layer, x, y);
    this.wVariable = this.solverWrapper.createVariable(w, UIPriority.P6);
    this.hVariable = this.solverWrapper.createVariable(h, UIPriority.P6);
  }

  /**
   * Gets the current width value from the solver.
   *
   * @returns The current width dimension
   */
  public get width(): number {
    return this.solverWrapper.readVariableValue(this.wVariable);
  }

  /**
   * Gets the current height value from the solver.
   *
   * @returns The current height dimension
   */
  public get height(): number {
    return this.solverWrapper.readVariableValue(this.hVariable);
  }

  /**
   * Sets the width value through the solver system.
   *
   * @param value - The new width dimension (must be positive)
   *
   * @throws Error if value is not a valid positive number
   */
  public set width(value: number) {
    assertValidPositiveNumber(value, "UIDummy width");
    this.solverWrapper.suggestVariableValue(this.wVariable, value);
  }

  /**
   * Sets the height value through the solver system.
   *
   * @param value - The new height dimension (must be positive)
   *
   * @throws Error if value is not a valid positive number
   */
  public set height(value: number) {
    assertValidPositiveNumber(value, "UIDummy height");
    this.solverWrapper.suggestVariableValue(this.hVariable, value);
  }

  /**
   * Destroys the dummy element by removing its solver variables.
   * After calling this method, the dummy element should not be used anymore.
   */
  public override destroy(): void {
    this.solverWrapper.removeVariable(this.hVariable);
    this.solverWrapper.removeVariable(this.wVariable);
    super.destroy();
  }
}

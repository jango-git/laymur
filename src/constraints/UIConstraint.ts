import { type UILayer } from "../layers/UILayer";

import type { UISolverWrapper } from "../wrappers/UISolverWrapper";

/**
 * Abstract base class for UI layout constraints.
 *
 * Provides access to the solver wrapper for creating constraint relationships
 * between UI elements.
 *
 * @public
 */
export abstract class UIConstraint {
  /** Optional name identifier for the constraint. */
  public name = "";

  /** @internal */
  protected readonly solverWrapper: UISolverWrapper;

  /**
   * Creates a UIConstraint instance.
   *
   * @param layer - UI layer that contains this constraint
   */
  constructor(public readonly layer: UILayer) {
    this.solverWrapper = this.layer["getSolverWrapperInternal"]();
  }
}

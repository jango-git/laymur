import { type UILayer } from "../layers/UILayer";

import type { UISolverWrapper } from "../wrappers/UISolverWrapper";

/**
 * Abstract base class for all UI layout constraints.
 *
 * UIConstraint serves as the fundamental building block for the constraint-based
 * layout system. It provides access to the solver wrapper for creating and
 * managing constraint relationships between UI elements. All concrete constraint
 * implementations must extend this class to participate in the layout solving process.
 *
 * @see {@link UILayer} - Container layer for constraints
 * @see {@link UISolverWrapper} - Constraint solver integration
 */
export abstract class UIConstraint {
  /** Optional name identifier for the constraint. */
  public name = "";

  /**
   * Reference to the constraint solver wrapper for managing solver operations.
   * @see {@link UISolverWrapper}
   */
  protected readonly solverWrapper: UISolverWrapper;

  /**
   * Creates a new UIConstraint instance.
   *
   * @param layer - The UI layer that contains this constraint
   */
  constructor(public readonly layer: UILayer) {
    this.solverWrapper = this.layer["getSolverWrapperInternal"]();
  }
}

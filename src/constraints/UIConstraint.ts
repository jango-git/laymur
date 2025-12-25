import type { UILayer } from "../layers/UILayer/UILayer";
import type { UISolverWrapperInterface } from "../wrappers/UISolverWrapper/UISolverWrapper.Internal";

/** Base class for layout constraints */
export abstract class UIConstraint {
  /** Optional constraint name */
  public name: string;

  /** Constraint solver wrapper */
  protected readonly solverWrapper: UISolverWrapperInterface;

  /** @param layer Layer containing this constraint */
  constructor(
    public readonly layer: UILayer,
    name?: string,
  ) {
    this.solverWrapper = this.layer.solverWrapper;
    this.name = name ?? "";
  }
}

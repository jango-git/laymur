import type { UILayer } from "../layers/UILayer/UILayer.js";
import type { UISolverWrapperView } from "../wrappers/UISolverWrapper/UISolverWrapper.Internal.js";

/** Base class for layout constraints */
export abstract class UIConstraint {
  /** Optional constraint name */
  public name: string;

  /** Constraint solver wrapper */
  protected readonly solverWrapper: UISolverWrapperView;

  private destroyedInternal = false;

  /** @param layer Layer containing this constraint */
  constructor(
    public readonly layer: UILayer,
    name?: string,
  ) {
    this.solverWrapper = this.layer.solverWrapper;
    this.name = name ?? "";
    this.layer.addConstraint(this);
  }

  /**
   * Whether the constraint is removed from its layer. A constraint is removed by its own
   * `destroy`, or together with an element it refers to or with its layer.
   */
  public get destroyed(): boolean {
    return this.destroyedInternal;
  }

  /** Removes constraint from its layer. Does nothing if the constraint is already destroyed. */
  public destroy(): void {
    if (this.destroyedInternal) {
      return;
    }
    this.destroyedInternal = true;
    this.destroyInternal();
    this.layer.removeConstraint(this);
  }

  /** Frees what the subclass holds; called once, before the constraint leaves its layer */
  protected destroyInternal(): void {}

  /**
   * Throws if the constraint is destroyed.
   * @param subject Name of the changed property for the error message
   */
  protected assertNotDestroyed(subject: string): void {
    if (this.destroyedInternal) {
      throw new Error(`${subject}: constraint is destroyed`);
    }
  }

  /**
   * Checks whether the constraint refers to a solver variable.
   * @param index Solver variable index
   * @returns True if the variable is used by the constraint
   */
  public abstract isUsingVariable(index: number): boolean;
}

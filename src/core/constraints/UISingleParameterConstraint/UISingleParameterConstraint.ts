import type { UILayer } from "../../layers/UILayer/UILayer.js";
import { resolveOrientation, UIOrientation } from "../../miscellaneous/UIOrientation.js";
import type { UIPriority } from "../../miscellaneous/UIPriority.js";
import { resolvePriority } from "../../miscellaneous/UIPriority.js";
import type { UIRelation } from "../../miscellaneous/UIRelation.js";
import { resolveRelation } from "../../miscellaneous/UIRelation.js";
import { UIConstraint } from "../UIConstraint.js";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal.js";

/** Base class for constraints with priority, relation, and orientation */
export abstract class UISingleParameterConstraint extends UIConstraint {
  /** Constraint priority */
  private priorityInternal: UIPriority;
  /** Constraint relation */
  private relationInternal: UIRelation;
  /** Constraint orientation */
  private orientationInternal: UIOrientation;

  /** Solver constraint descriptor */
  protected abstract readonly constraint: number;

  /**
   * @param layer Layer containing this constraint
   * @param options Constraint configuration
   */
  constructor(layer: UILayer, options?: Partial<UISingleParameterConstraintOptions>) {
    super(layer, options?.name);
    this.priorityInternal = resolvePriority(options?.priority);
    this.relationInternal = resolveRelation(options?.relation);
    this.orientationInternal = resolveOrientation(options?.orientation);
    this.layer.signalOrientationChanged.on(this.onOrientationChange);
  }

  /** Constraint priority */
  public get priority(): UIPriority {
    return this.priorityInternal;
  }

  /** Constraint relation */
  public get relation(): UIRelation {
    return this.relationInternal;
  }

  /** When constraint is active */
  public get orientation(): UIOrientation {
    return this.orientationInternal;
  }

  /** Updates constraint priority */
  public set priority(value: UIPriority) {
    this.assertNotDestroyed("UISingleParameterConstraint.priority");
    if (value !== this.priorityInternal) {
      this.priorityInternal = value;
      this.solverWrapper.setConstraintPriority(this.constraint, this.priorityInternal);
    }
  }

  /** Updates constraint relation */
  public set relation(value: UIRelation) {
    this.assertNotDestroyed("UISingleParameterConstraint.relation");
    if (value !== this.relationInternal) {
      this.relationInternal = value;
      this.solverWrapper.setConstraintRelation(this.constraint, this.relationInternal);
    }
  }

  /** Updates when constraint is active */
  public set orientation(value: UIOrientation) {
    this.assertNotDestroyed("UISingleParameterConstraint.orientation");
    if (value !== this.orientationInternal) {
      this.orientationInternal = value;
      this.onOrientationChange();
    }
  }

  /**
   * Checks whether the constraint refers to a solver variable.
   * @param index Solver variable index
   * @returns True if the variable is used by the constraint
   */
  public isUsingVariable(index: number): boolean {
    return !this.destroyed && this.solverWrapper.isConstraintUsingVariable(this.constraint, index);
  }

  /** Removes constraint from solver and cleans up listeners */
  protected override destroyInternal(): void {
    this.layer.signalOrientationChanged.off(this.onOrientationChange);
    this.solverWrapper.removeConstraint(this.constraint);
  }

  /**
   * Checks if constraint should be active for current orientation.
   * @returns True if orientation is ALWAYS or matches layer orientation
   */
  protected isConstraintEnabled(): boolean {
    return (
      this.orientationInternal === UIOrientation.ALWAYS ||
      this.orientationInternal === this.layer.orientation
    );
  }

  /** Updates constraint enabled state when layer orientation changes */
  private readonly onOrientationChange = (): void => {
    this.solverWrapper.setConstraintEnabled(this.constraint, this.isConstraintEnabled());
  };
}

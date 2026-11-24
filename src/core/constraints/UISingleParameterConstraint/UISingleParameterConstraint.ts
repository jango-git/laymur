import type { UILayer } from "../../layers/UILayer/UILayer.js";
import { assertNotDestroyed } from "../../miscellaneous/asserts.js";
import type { UIOrientation } from "../../miscellaneous/UIOrientation.js";
import { isOrientationIncluded, resolveOrientation } from "../../miscellaneous/UIOrientation.js";
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

  /** Orientations of the layer the constraint is active in, as combined flags */
  public get orientation(): UIOrientation {
    return this.orientationInternal;
  }

  /** Whether the current orientation of the layer is among those of the constraint */
  public get enabled(): boolean {
    return isOrientationIncluded(this.orientationInternal, this.layer.orientation);
  }

  /**
   * Whether the solver applies the constraint. False while the orientation of the layer disables
   * it, or while it conflicts with other required (P0) constraints, the later created of which is
   * not applied. A conflict throws in development builds and warns in production builds.
   */
  public get applied(): boolean {
    return !this.destroyed && this.solverWrapper.isConstraintApplied(this.constraint);
  }

  /** Updates constraint priority */
  public set priority(value: UIPriority) {
    assertNotDestroyed(this, "constraint", "UISingleParameterConstraint.priority");
    if (value !== this.priorityInternal) {
      this.priorityInternal = value;
      this.solverWrapper.setConstraintPriority(this.constraint, this.priorityInternal);
    }
  }

  /** Updates constraint relation */
  public set relation(value: UIRelation) {
    assertNotDestroyed(this, "constraint", "UISingleParameterConstraint.relation");
    if (value !== this.relationInternal) {
      this.relationInternal = value;
      this.solverWrapper.setConstraintRelation(this.constraint, this.relationInternal);
    }
  }

  /** Updates the orientations the constraint is active in */
  public set orientation(value: UIOrientation) {
    assertNotDestroyed(this, "constraint", "UISingleParameterConstraint.orientation");
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

  /** Updates constraint enabled state when layer orientation changes */
  private readonly onOrientationChange = (): void => {
    this.solverWrapper.setConstraintEnabled(this.constraint, this.enabled);
  };
}

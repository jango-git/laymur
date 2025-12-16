import type { UILayer } from "../layers/UILayer";
import { UILayerEvent } from "../layers/UILayer.Internal";
import {
  resolveOrientation,
  UIOrientation,
} from "../miscellaneous/UIOrientation";
import type { UIPriority } from "../miscellaneous/UIPriority";
import { resolvePriority } from "../miscellaneous/UIPriority";
import type { UIRelation } from "../miscellaneous/UIRelation";
import { resolveRelation } from "../miscellaneous/UIRelation";
import { UIConstraint } from "./UIConstraint";
import type { UISingleParameterConstraintOptions } from "./UISingleParameterConstraint.Internal";

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
  constructor(
    layer: UILayer,
    options?: Partial<UISingleParameterConstraintOptions>,
  ) {
    super(layer);
    this.priorityInternal = resolvePriority(options?.priority);
    this.relationInternal = resolveRelation(options?.relation);
    this.orientationInternal = resolveOrientation(options?.orientation);
    this.layer.on(UILayerEvent.ORIENTATION_CHANGED, this.onOrientationChange);
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
    if (value !== this.priorityInternal) {
      this.priorityInternal = value;
      this.solverWrapper.setConstraintPriority(
        this.constraint,
        this.priorityInternal,
      );
    }
  }

  /** Updates constraint relation */
  public set relation(value: UIRelation) {
    if (value !== this.relationInternal) {
      this.relationInternal = value;
      this.solverWrapper.setConstraintRelation(
        this.constraint,
        this.relationInternal,
      );
    }
  }

  /** Updates when constraint is active */
  public set orientation(value: UIOrientation) {
    if (value !== this.orientationInternal) {
      this.orientationInternal = value;
      this.onOrientationChange();
    }
  }

  /** Removes constraint from solver and cleans up listeners */
  public destroy(): void {
    this.layer.off(UILayerEvent.ORIENTATION_CHANGED, this.onOrientationChange);
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
    this.solverWrapper.setConstraintEnabled(
      this.constraint,
      this.isConstraintEnabled(),
    );
  };
}

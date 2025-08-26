import type { UILayer } from "../layers/UILayer";
import { UILayerEvent } from "../layers/UILayer";
import {
  resolveOrientation,
  UIOrientation,
} from "../miscellaneous/UIOrientation";
import { resolvePriority, type UIPriority } from "../miscellaneous/UIPriority";
import { resolveRelation, type UIRelation } from "../miscellaneous/UIRelation";
import { UIConstraint } from "./UIConstraint";

/**
 * Configuration options for UISingleParameterConstraint creation.
 *
 * @public
 */
export interface UISingleParameterConstraintOptions {
  /** Priority level for the constraint in the solver hierarchy. */
  priority: UIPriority;
  /** Mathematical relation type for the constraint equation. */
  relation: UIRelation;
  /** Orientation context for when the constraint should be active. */
  orientation: UIOrientation;
}

/**
 * Abstract base class for constraints with configurable parameters.
 *
 * Extends UIConstraint with priority, relation, and orientation configuration.
 * Provides orientation-based enabling/disabling of constraints.
 *
 * @public
 */
export abstract class UISingleParameterConstraint extends UIConstraint {
  /** @internal */
  protected priorityInternal: UIPriority;
  /** @internal */
  protected relationInternal: UIRelation;
  /** @internal */
  protected orientationInternal: UIOrientation;

  /** @internal */
  protected abstract readonly constraint: number;

  /**
   * Creates a UISingleParameterConstraint instance.
   *
   * Sets up orientation change event handling for dynamic constraint activation.
   *
   * @param layer - UI layer that contains this constraint
   * @param priority - Priority level (defaults to P0)
   * @param relation - Relation type (defaults to EQUAL)
   * @param orientation - Orientation setting (defaults to ALWAYS)
   */
  constructor(
    layer: UILayer,
    priority?: UIPriority,
    relation?: UIRelation,
    orientation?: UIOrientation,
  ) {
    super(layer);
    this.priorityInternal = resolvePriority(priority);
    this.relationInternal = resolveRelation(relation);
    this.orientationInternal = resolveOrientation(orientation);
    this.layer.on(UILayerEvent.ORIENTATION_CHANGE, this.onOrientationChange);
  }

  /**
   * Gets the priority level.
   *
   * @returns Constraint priority level
   */
  public get priority(): UIPriority {
    return this.priorityInternal;
  }

  /**
   * Gets the mathematical relation type.
   *
   * @returns Constraint relation type
   */
  public get relation(): UIRelation {
    return this.relationInternal;
  }

  /**
   * Gets the orientation setting.
   *
   * @returns Constraint orientation setting
   */
  public get orientation(): UIOrientation {
    return this.orientationInternal;
  }

  /**
   * Sets the priority level.
   *
   * @param value - New priority level
   */
  public set priority(value: UIPriority) {
    if (value !== this.priorityInternal) {
      this.priorityInternal = value;
      this.solverWrapper.setConstraintPriority(
        this.constraint,
        this.priorityInternal,
      );
    }
  }

  /**
   * Sets the mathematical relation type.
   *
   * @param value - New relation type
   */
  public set relation(value: UIRelation) {
    if (value !== this.relationInternal) {
      this.relationInternal = value;
      this.solverWrapper.setConstraintRelation(
        this.constraint,
        this.relationInternal,
      );
    }
  }

  /**
   * Sets the orientation setting.
   *
   * @param value - New orientation setting
   */
  public set orientation(value: UIOrientation) {
    if (value !== this.orientationInternal) {
      this.orientationInternal = value;
      this.onOrientationChange();
    }
  }

  /**
   * Destroys the constraint and cleans up resources.
   */
  public destroy(): void {
    this.layer.off(UILayerEvent.ORIENTATION_CHANGE, this.onOrientationChange);
    this.solverWrapper.removeConstraint(this.constraint);
  }

  /**
   * Determines if the constraint should be enabled based on orientation.
   *
   * @returns True if the constraint should be enabled
   * @internal
   */
  protected isConstraintEnabled(): boolean {
    return (
      this.orientationInternal === UIOrientation.ALWAYS ||
      this.orientationInternal === this.layer.orientation
    );
  }

  /** @internal */
  private readonly onOrientationChange = (): void => {
    this.solverWrapper.setConstraintEnabled(
      this.constraint,
      this.isConstraintEnabled(),
    );
  };
}

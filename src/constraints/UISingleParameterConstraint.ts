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
 * Abstract base class for constraints that operate with configurable parameters.
 *
 * UISingleParameterConstraint extends UIConstraint with common functionality
 * for constraints that need priority, relation, and orientation configuration.
 * It provides automatic orientation-based enabling/disabling of constraints
 * and manages the lifecycle of solver constraint descriptors.
 *
 * @see {@link UIConstraint} - Base constraint class
 * @see {@link UIPriority} - Priority level configuration
 * @see {@link UIRelation} - Mathematical relation types
 * @see {@link UIOrientation} - Orientation-based activation
 */
export abstract class UISingleParameterConstraint extends UIConstraint {
  /** Internal storage for the constraint priority level. */
  protected priorityInternal: UIPriority;
  /** Internal storage for the constraint relation type. */
  protected relationInternal: UIRelation;
  /** Internal storage for the constraint orientation setting. */
  protected orientationInternal: UIOrientation;

  /** The constraint descriptor managed by the solver system. */
  protected abstract readonly constraint: number;

  /**
   * Creates a new UISingleParameterConstraint instance.
   *
   * Initializes the constraint with resolved default values and sets up
   * orientation change event handling for dynamic constraint activation.
   *
   * @param layer - The UI layer that contains this constraint
   * @param priority - Optional priority level (defaults to P0)
   * @param relation - Optional relation type (defaults to EQUAL)
   * @param orientation - Optional orientation setting (defaults to ALWAYS)
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
   * Gets the current priority level of the constraint.
   * @returns The constraint priority level
   */
  public get priority(): UIPriority {
    return this.priorityInternal;
  }

  /**
   * Gets the current mathematical relation type of the constraint.
   * @returns The constraint relation type
   */
  public get relation(): UIRelation {
    return this.relationInternal;
  }

  /**
   * Gets the current orientation setting of the constraint.
   * @returns The constraint orientation setting
   */
  public get orientation(): UIOrientation {
    return this.orientationInternal;
  }

  /**
   * Sets a new priority level for the constraint.
   * @param value - The new priority level
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
   * Sets a new mathematical relation type for the constraint.
   * @param value - The new relation type
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
   * Sets a new orientation setting for the constraint.
   * @param value - The new orientation setting
   */
  public set orientation(value: UIOrientation) {
    if (value !== this.orientationInternal) {
      this.orientationInternal = value;
      this.onOrientationChange();
    }
  }

  /**
   * Destroys the constraint by cleaning up event listeners and solver resources.
   *
   * This method removes the orientation change event listener and removes
   * the constraint from the solver system. After calling this method,
   * the constraint should not be used anymore.
   */
  public destroy(): void {
    this.layer.off(UILayerEvent.ORIENTATION_CHANGE, this.onOrientationChange);
    this.solverWrapper.removeConstraint(this.constraint);
  }

  /**
   * Determines if the constraint should be enabled based on orientation.
   *
   * The constraint is enabled if its orientation is set to ALWAYS or if
   * it matches the current layer orientation.
   *
   * @returns True if the constraint should be enabled, false otherwise
   * @protected
   */
  protected isConstraintEnabled(): boolean {
    return (
      this.orientationInternal === UIOrientation.ALWAYS ||
      this.orientationInternal === this.layer.orientation
    );
  }

  /**
   * Event handler for layer orientation changes.
   *
   * Updates the constraint's enabled state in the solver based on the
   * current orientation and the constraint's orientation setting.
   *
   * @private
   */
  private readonly onOrientationChange = (): void => {
    this.solverWrapper.setConstraintEnabled(
      this.constraint,
      this.isConstraintEnabled(),
    );
  };
}

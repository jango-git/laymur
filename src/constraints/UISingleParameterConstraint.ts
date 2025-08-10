import type { UILayer } from "../layers/UILayer";
import { UILayerEvent } from "../layers/UILayer";
import { UIOrientation } from "../miscellaneous/UIOrientation";
import type { UIPriority } from "../miscellaneous/UIPriority";
import type { UIRelation } from "../miscellaneous/UIRelation";
import { UIConstraint } from "./UIConstraint";

export interface UISingleParameterConstraintOptions {
  priority: UIPriority;
  relation: UIRelation;
  orientation: UIOrientation;
}

export abstract class UISingleParameterConstraint extends UIConstraint {
  protected abstract readonly constraint: number;

  constructor(
    layer: UILayer,
    priority?: UIPriority,
    relation?: UIRelation,
    orientation?: UIOrientation,
  ) {
    super(layer, priority, relation, orientation);
    this.layer.on(UILayerEvent.ORIENTATION_CHANGE, this.onOrientationChange);
  }

  public get priority(): UIPriority {
    return this.priorityInternal;
  }

  public get relation(): UIRelation {
    return this.relationInternal;
  }

  public get orientation(): UIOrientation {
    return this.orientationInternal;
  }

  public set priority(value: UIPriority) {
    if (value !== this.priorityInternal) {
      this.priorityInternal = value;
      this.solverWrapper.setConstraintPriority(
        this.constraint,
        this.priorityInternal,
      );
    }
  }

  public set relation(value: UIRelation) {
    if (value !== this.relationInternal) {
      this.relationInternal = value;
      this.solverWrapper.setConstraintRelation(
        this.constraint,
        this.relationInternal,
      );
    }
  }

  public set orientation(value: UIOrientation) {
    if (value !== this.orientationInternal) {
      this.orientationInternal = value;
      this.onOrientationChange();
    }
  }

  public destroy(): void {
    this.layer.off(UILayerEvent.ORIENTATION_CHANGE, this.onOrientationChange);
    this.solverWrapper.removeConstraint(this.constraint);
  }

  protected isConstraintEnabled(): boolean {
    return (
      this.orientationInternal === UIOrientation.ALWAYS ||
      this.orientationInternal === this.layer.orientation
    );
  }

  private readonly onOrientationChange = (): void => {
    this.solverWrapper.setConstraintEnabled(
      this.constraint,
      this.isConstraintEnabled(),
    );
  };
}

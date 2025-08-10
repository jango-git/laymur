import { type UILayer } from "../layers/UILayer";
import {
  resolveOrientation,
  type UIOrientation,
} from "../miscellaneous/UIOrientation";

import { resolvePriority, type UIPriority } from "../miscellaneous/UIPriority";
import { resolveRelation, type UIRelation } from "../miscellaneous/UIRelation";
import type { UISolverWrapper } from "../wrappers/UISolverWrapper";

export abstract class UIConstraint {
  public name = "";

  protected readonly solverWrapper: UISolverWrapper;
  protected priorityInternal: UIPriority;
  protected relationInternal: UIRelation;
  protected orientationInternal: UIOrientation;

  constructor(
    public readonly layer: UILayer,
    priority?: UIPriority,
    relation?: UIRelation,
    orientation?: UIOrientation,
  ) {
    this.solverWrapper = this.layer["getSolverWrapperInternal"]();
    this.priorityInternal = resolvePriority(priority);
    this.relationInternal = resolveRelation(relation);
    this.orientationInternal = resolveOrientation(orientation);
  }

  public abstract get priority(): UIPriority;

  public abstract get relation(): UIRelation;

  public abstract get orientation(): UIOrientation;

  public abstract set priority(value: UIPriority);

  public abstract set relation(value: UIRelation);

  public abstract set orientation(value: UIOrientation);
}

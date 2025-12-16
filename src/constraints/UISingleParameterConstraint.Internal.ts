import type { UIOrientation } from "../miscellaneous/UIOrientation";
import type { UIPriority } from "../miscellaneous/UIPriority";
import type { UIRelation } from "../miscellaneous/UIRelation";

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

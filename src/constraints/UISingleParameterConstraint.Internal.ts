import type { UIOrientation } from "../miscellaneous/UIOrientation";
import type { UIPriority } from "../miscellaneous/UIPriority";
import type { UIRelation } from "../miscellaneous/UIRelation";

/** Single parameter constraint options */
export interface UISingleParameterConstraintOptions {
  /** Constraint priority */
  priority: UIPriority;
  /** Constraint relation */
  relation: UIRelation;
  /** When constraint is active */
  orientation: UIOrientation;
}

import type { UIOrientation } from "../../miscellaneous/UIOrientation.js";
import type { UIPriority } from "../../miscellaneous/UIPriority.js";
import type { UIRelation } from "../../miscellaneous/UIRelation.js";

/** Single parameter constraint options */
export interface UISingleParameterConstraintOptions {
  /** Constraint name */
  name: string;
  /** Constraint priority */
  priority: UIPriority;
  /** Constraint relation */
  relation: UIRelation;
  /** When constraint is active */
  orientation: UIOrientation;
}

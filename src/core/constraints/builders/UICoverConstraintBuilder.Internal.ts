import type { UIOrientation } from "../../miscellaneous/UIOrientation";

export const COVER_CONSTRAINT_DEFAULT_ANCHOR = 0.5;

/** Cover constraint builder options */
export interface UICoverConstraintBuilderOptions {
  /** Whether to maintain active element aspect ratio */
  keepActiveAspect: boolean;
  /** Horizontal anchor (0 = left, 0.5 = center, 1 = right) */
  anchorH: number;
  /** Vertical anchor (0 = bottom, 0.5 = center, 1 = top) */
  anchorV: number;
  /** Orientation for constraints */
  orientation: UIOrientation;
}

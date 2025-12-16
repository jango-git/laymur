import type { UIOrientation } from "../../miscellaneous/UIOrientation";
import type { UIPriority } from "../../miscellaneous/UIPriority";
import type { UIRelation } from "../../miscellaneous/UIRelation";

/** Horizontal and vertical values */
export interface UIType2D<T> {
  /** Horizontal value */
  h?: T;
  /** Vertical value */
  v?: T;
}

/** Base 2D constraint options */
export interface UIConstraint2DOptions {
  /** Priority for each axis */
  priority: UIType2D<UIPriority>;
  /** Relation for each axis */
  relation: UIType2D<UIRelation>;
  /** Orientation for each axis */
  orientation: UIType2D<UIOrientation>;
}

/** 2D size constraint options */
export interface UIConstraintSize2DOptions extends UIConstraint2DOptions {
  /** Width and height */
  size: UIType2D<number>;
}

/** 2D distance constraint options */
export interface UIConstraintDistance2DOptions extends UIConstraint2DOptions {
  /** Anchor on element A for each axis */
  anchorA: UIType2D<number>;
  /** Anchor on element B for each axis */
  anchorB: UIType2D<number>;
  /** Distance for each axis */
  distance: UIType2D<number>;
}

/** 2D proportion constraint options */
export interface UIConstraintProportion2DOptions extends UIConstraint2DOptions {
  /** Proportion for each axis */
  proportion: UIType2D<number>;
}

/** Horizontal and vertical constraint pair */
export interface UIConstraint2DResult<TH, TV> {
  /** Horizontal constraint */
  h: TH;
  /** Vertical constraint */
  v: TV;
}
